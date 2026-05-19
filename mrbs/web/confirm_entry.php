<?php
session_start();
//echo "Hello" . $_GET['UserName'] ;


	$approved = "อนุมัติ";
	$eject = "ไม่อนุมัติ";
    $remark = "หมายเหตุ";
	$approvedby = "อนุมัติโดย";
	$approvedby2 = "ประสิทธิ์";
	$confirm="ยืนยัน";
    $approved = iconv("tis-620", "utf-8", $approved );
    $eject = iconv("tis-620", "utf-8", $eject );
    $remark = iconv("tis-620", "utf-8", $remark );
    $approvedby = iconv("tis-620", "utf-8", $approvedby );
    $approvedby2 = iconv("tis-620", "utf-8", $approvedby2 );
    $confirm = iconv("tis-620", "utf-8", $confirm );


//    $utf8 = iconv("tis-620", "utf-8", $tis620 );

?>
<html>
<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<style>
body {background-color: powderblue;}
h1   {color: blue;}
p    {	color: green;border: 1px solid powderblue;
		padding: 1px;
		font-family: verdana;
		font-size: 11;
	 }
	
	
</style>
</head>
<body>
<font size=11>
<FORM method=post action='confirm_entry_successful.php' accept-charset="UTF-8"> 
<p><input checked type="radio" name="Approve" id="Approved" value="Y" /><?php echo $approved; ?> <input type="radio" name="Approve" id="Approved" value="N" /><?php echo $eject; ?> </p>
<p><?php echo $remark; ?> : <textarea name="Remark" maxlength="200" rows="4" cols="50"></textarea>
<p><?php echo $approvedby; ?> : <input type="text" name="approvedby" value="<?php echo $approvedby2; ?>" />
<p><input type=hidden name=id value=<?php echo $_GET['id']; ?> />
<input type=hidden name=UserName value=<?php echo $_GET['UserName']; ?> />
<INPUT type="Submit" value="<?php echo $confirm; ?>" /> 
<INPUT type="reset" value="Reset" /> 
<INPUT type="button" value="Close Window" onClick="window.close();"/> 

</FORM>
</font>
</body>
</html>