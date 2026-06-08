#!/usr/bin/env python3
"""Sync bookings from MRBS (10.0.42.26) into car_reservation database."""

import subprocess
import sys
import os

SSH_HOST = "10.0.42.26"
SSH_USER = "root"
SSH_PASS  = "9EtrmZSS#"

MRBS_USER = "mrbs"
MRBS_PASS = "mrbs-p@ssw0rd"
MRBS_DB   = "mrbs"

LOCAL_USER = "carapp"
LOCAL_PASS = "carapp2024"
LOCAL_DB   = "car_reservation"

# room_id (MRBS) → vehicle_id (car_reservation)
ROOM_TO_VEHICLE = {7: 1, 6: 2, 5: 3, 8: 4}

def ssh_query(sql):
    cmd = f'mysql --default-character-set=utf8 -u {MRBS_USER} -p\'{MRBS_PASS}\' {MRBS_DB} -e "{sql}"'
    env = os.environ.copy()
    env["SSHPASS"] = SSH_PASS
    result = subprocess.run(
        ["sshpass", "-e", "ssh", "-o", "StrictHostKeyChecking=no",
         f"{SSH_USER}@{SSH_HOST}", cmd],
        capture_output=True, text=True, env=env
    )
    if result.returncode != 0:
        print(f"SSH Error: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip()

def local_query(sql, get_output=True):
    cmd = ["mysql", "--default-character-set=utf8",
           "-u", LOCAL_USER, f"-p{LOCAL_PASS}", LOCAL_DB, "-e", sql]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Local MySQL Error: {result.stderr}", file=sys.stderr)
        return None
    return result.stdout.strip() if get_output else None

def parse_tsv(raw):
    lines = raw.strip().split("\n")
    if len(lines) < 2:
        return []
    headers = lines[0].split("\t")
    return [dict(zip(headers, line.split("\t"))) for line in lines[1:]]

def escape(val):
    if val is None or val.strip() in ("", "NULL"):
        return "NULL"
    val = val.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{val}'"

def map_status(status_int, approved):
    if int(status_int) == 4:
        return "cancelled"
    if approved == "Y":
        return "approved"
    return "pending"

def build_user_map():
    raw = local_query("SELECT id, employee_id, username FROM users;")
    user_map = {}
    if raw:
        for line in raw.strip().split("\n")[1:]:
            parts = line.split("\t")
            if len(parts) >= 3:
                uid, emp_id, uname = parts[0], parts[1], parts[2]
                if emp_id:
                    user_map[emp_id] = int(uid)
                    user_map[emp_id.lower()] = int(uid)
                if uname:
                    user_map[uname] = int(uid)
                    user_map[uname.lower()] = int(uid)
    return user_map

def main():
    since = None
    if len(sys.argv) > 1:
        since = sys.argv[1]  # e.g. "2026-01-01 00:00:00"

    print("=== Sync MRBS Bookings → car_reservation ===\n")

    # Build user map
    user_map = build_user_map()
    print(f"Loaded {len(user_map)} user mappings")

    # Fetch MRBS entries
    where = f"WHERE e.timestamp >= '{since}'" if since else ""
    def clean(col):
        return f"REPLACE(REPLACE(REPLACE(COALESCE({col},''), CHAR(10),' '), CHAR(13),' '), CHAR(9),' ')"

    sql = (
        f"SELECT e.id, e.start_time, e.end_time, e.room_id, e.create_by, "
        f"{clean('e.name')} AS name, "
        f"{clean('e.description')} AS description, "
        f"e.status, COALESCE(e.approved,'') AS approved, "
        f"{clean('e.approvedby')} AS approvedby "
        f"FROM mrbs_entry e {where} ORDER BY e.id;"
    )
    print(f"Fetching MRBS entries{' since ' + since if since else ' (all)'}...")
    raw = ssh_query(sql)
    entries = parse_tsv(raw)
    print(f"Found {len(entries)} entries\n")

    inserted = updated = skipped = errors = 0

    for e in entries:
        mrbs_id   = e["id"]
        room_id   = int(e["room_id"])
        create_by = e["create_by"].strip()

        vehicle_id = ROOM_TO_VEHICLE.get(room_id)
        if not vehicle_id:
            skipped += 1
            continue

        user_id = user_map.get(create_by) or user_map.get(create_by.lower())
        if not user_id:
            skipped += 1
            print(f"  [SKIP] mrbs_id={mrbs_id} unknown user create_by={create_by}")
            continue

        start_dt = f"FROM_UNIXTIME({e['start_time']})"
        end_dt   = f"FROM_UNIXTIME({e['end_time']})"
        purpose  = escape(e["name"]) if e["name"].strip() else "'(ไม่ระบุ)'"
        notes    = escape(e.get("description", ""))
        status   = map_status(e.get("status", "0"), e.get("approved", ""))

        # approver mapping
        approver_id = "NULL"
        if e.get("approvedby", "").strip():
            ab = e["approvedby"].strip()
            approver_id_val = user_map.get(ab) or user_map.get(ab.lower())
            if approver_id_val:
                approver_id = str(approver_id_val)

        approved_at = "NULL" if status != "approved" else "NOW()"

        sql_upsert = f"""
INSERT INTO bookings
  (mrbs_id, vehicle_id, user_id, purpose, notes, start_datetime, end_datetime,
   status, approved_by, approved_at, passenger_count)
VALUES
  ({mrbs_id}, {vehicle_id}, {user_id}, {purpose}, {notes},
   {start_dt}, {end_dt}, '{status}', {approver_id}, {approved_at}, 1)
ON DUPLICATE KEY UPDATE
  vehicle_id      = VALUES(vehicle_id),
  user_id         = VALUES(user_id),
  purpose         = VALUES(purpose),
  notes           = VALUES(notes),
  start_datetime  = VALUES(start_datetime),
  end_datetime    = VALUES(end_datetime),
  status          = VALUES(status),
  approved_by     = VALUES(approved_by),
  approved_at     = VALUES(approved_at);
""".strip()

        result = local_query(sql_upsert, get_output=True)
        if result is None:
            errors += 1
            print(f"  [ERROR] mrbs_id={mrbs_id}")
        else:
            # MySQL returns "1 row" for insert, "2 rows" for update-on-dup
            if "2" in (result or ""):
                updated += 1
            else:
                inserted += 1

    print(f"\n=== Done ===")
    print(f"Inserted : {inserted}")
    print(f"Updated  : {updated}")
    print(f"Skipped  : {skipped}")
    print(f"Errors   : {errors}")

if __name__ == "__main__":
    main()
