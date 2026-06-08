#!/usr/bin/env python3
"""Import users from MRBS system (10.0.42.26) into car_reservation database."""

import subprocess
import os
import sys

# SSH config
SSH_HOST = "10.0.42.26"
SSH_USER = "root"
SSH_PASS  = "9EtrmZSS#"

# MRBS MySQL
MRBS_USER = "mrbs"
MRBS_PASS = "mrbs-p@ssw0rd"
MRBS_DB = "mrbs"

# Local MySQL
LOCAL_USER = "carapp"
LOCAL_PASS = "carapp2024"
LOCAL_DB = "car_reservation"

LEVEL_TO_ROLE = {
    1: "user",
    2: "approver",
    3: "admin",
}

def ssh_query(sql):
    env = os.environ.copy()
    env["SSHPASS"] = SSH_PASS
    cmd = f'mysql --default-character-set=utf8 -u {MRBS_USER} -p\'{MRBS_PASS}\' {MRBS_DB} -e "{sql}"'
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
    cmd = ["mysql", "-u", LOCAL_USER, f"-p{LOCAL_PASS}", LOCAL_DB, "-e", sql]
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
    rows = []
    for line in lines[1:]:
        values = line.split("\t")
        rows.append(dict(zip(headers, values)))
    return rows

def escape_sql(val):
    if val is None or val == "NULL":
        return "NULL"
    val = val.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{val}'"

def main():
    print("=== Import MRBS Users → car_reservation ===\n")

    # Fetch all MRBS users
    print("Fetching users from MRBS (10.0.42.26)...")
    raw = ssh_query("SELECT id, level, name, password_hash, email, first_name, last_name, dept_name FROM mrbs_users ORDER BY id;")
    users = parse_tsv(raw)
    print(f"Found {len(users)} users in MRBS\n")

    # Check existing usernames in car_reservation
    existing_raw = local_query("SELECT username FROM users;")
    existing_usernames = set()
    if existing_raw:
        for line in existing_raw.strip().split("\n")[1:]:
            existing_usernames.add(line.strip())
    print(f"Existing usernames in car_reservation: {existing_usernames}\n")

    inserted = 0
    skipped = 0
    skipped_list = []

    for u in users:
        username = u.get("name", "").strip()
        if not username:
            continue

        if username in existing_usernames:
            skipped += 1
            skipped_list.append(username)
            continue

        level = int(u.get("level", 1))
        role = LEVEL_TO_ROLE.get(level, "user")

        # Fix bcrypt prefix $2y$ → $2a$
        pw_hash = u.get("password_hash", "").strip()
        if pw_hash.startswith("$2y$"):
            pw_hash = "$2a$" + pw_hash[4:]

        first = u.get("first_name", "").strip()
        last = u.get("last_name", "").strip()
        full_name = f"{first} {last}".strip() or username

        email = u.get("email", "").strip()
        if not email or email == "NULL":
            email = None

        dept = u.get("dept_name", "").strip()
        if not dept or dept == "NULL":
            dept = None

        # employee_id: use name if it looks like employee number (numeric)
        emp_id = username if username.isdigit() else None

        sql = f"""INSERT INTO users (employee_id, username, password_hash, full_name, email, department, role, is_active)
VALUES ({escape_sql(emp_id)}, {escape_sql(username)}, {escape_sql(pw_hash)}, {escape_sql(full_name)},
       {escape_sql(email)}, {escape_sql(dept)}, '{role}', 1);"""

        result = local_query(sql, get_output=False)
        if result is None:
            print(f"  [ERROR] Failed to insert: {username}")
        else:
            inserted += 1
            print(f"  [OK] {username} ({full_name}) — {role} — {dept or '-'}")

    print(f"\n=== Done ===")
    print(f"Inserted : {inserted}")
    print(f"Skipped  : {skipped} (already exist: {', '.join(skipped_list)})")

if __name__ == "__main__":
    main()
