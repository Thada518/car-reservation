<html>
<head>
<meta http-equiv=Content-Type content="text/html; charset=TIS-620">
</head>
<body>
<?php


// Set up mb_string internal encoding
$servername = "localhost";
$username = "mrbs";
$password = "mrbs-p@ssw0rd";
$dbname = "mrbs";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
mysqli_set_charset($conn, "utf8");
$remark = $_POST["Remark"];
$id = $_POST["id"];
$approve = $_POST["Approve"];
$approvedby = $_POST["approvedby"];

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 


//echo "<p>approve:" . $approve;
//echo "<p>remark:" . $remark;
//echo "<p>approvedby:" . $approvedby;
//echo "<p>id:" . $id . "<br>";

$sql = "UPDATE mrbs.mrbs_entry SET approved='" . $approve . "',remark='" . $remark . "',approvedby='" . $approvedby . "' WHERE id=" . $id;

if ($conn->query($sql) === TRUE) {
    echo "Record updated successfully";
} else {
    echo "Error updating record: " . $conn->error;
}

$conn->close();
?>


<FORM> 
<p>Confirm Successful!!<br>

<INPUT type="button" value="Close Window" onClick="window.close();"> 

</FORM>

</body>
</html>