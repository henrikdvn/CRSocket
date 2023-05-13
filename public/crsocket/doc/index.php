<?php
error_reporting(E_ALL);
include_once("../boot.php");
$section = $_GET["section"];
$name = $_GET["name"];
$sourcePath = CRSOCKET_DOC."/$section/$name.html";
header("Content-type: text/html; charset=UTF-8");
echo "<!DOCTYPE html>\n";
echo "<html lang='en'>\n";
echo "<head>\n";
echo "<title>$name</title>\n";
echo "<link href='css/styles.css' rel='stylesheet' type='text/css'>\n";
echo "</head>\n";
readfile($sourcePath);
echo "</html>\n";
