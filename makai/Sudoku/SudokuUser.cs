using Newtonsoft.Json;

namespace makai.Sudoku;

public class SudokuUser
{
    //Normal fields
    public string username {get;set;} = "";
    public int uid {get;set;} = -1;
    public bool admin {get;set;} = false;

     //This is special and needs to be filled in due to the design of sudoku
    public Dictionary<string, MySudokuOption> options {get;set;} = new Dictionary<string, MySudokuOption>();

    public bool loggedIn {get;set;}

    //Weird things we used to do
    public string jsonoptions => JsonConvert.SerializeObject(options);
    public bool exists => uid > 0 && !string.IsNullOrWhiteSpace(username);

   //User settings are NOT pulled when user is initialized. Instead, they are
   //only pulled if needed, but still only pulled once.
   //public function options()
   //{
   //   if(!is_array($this->_options))
   //   {
   //      $db = new MySudokuDB();
   //      $this->_options = array(
   //         "lowperformance" => new MySudokuOption(false, "Low Performance Mode"),
   //         "completed" => new MySudokuOption(true, "Disable buttons for completed numbers"),
   //         "noteremove" => new MySudokuOption(true, "Automatic note removal"),
   //         "doubleclicknotes" => new MySudokuOption(false, "Double click toggles note mode"),
   //         "highlighterrors" => new MySudokuOption(true, "Highlight conflicting cells"),
   //         "backgroundstyle" => new MySudokuOption("default", "Background style",
   //         array("default", "rainbow", "flow"))
   //      );

   //      //Get the dang data already
   //      $query = <<<SQL
   //         SELECT s.name, s.value
   //         FROM users u JOIN settings s ON u.uid=s.uid
   //         WHERE u.uid=?
//SQL//;
   //      $results = $db->query($query, "i", $this->uid);

   //      //Database error (not a query error hopefully)
   //      if($results === false)
   //      {
   //         //This line is useless
   //         $error = "Database failure: " . $db->getError();
   //      }
   //      else
   //      {
   //         while($row = $results->fetch_assoc())
   //         {
   //            if(getValue($this->_options, $row["name"], false))
   //               $this->_options[$row["name"]]->value = json_decode($row["value"], true);
   //         }
   //      }
   //   }

   //   return $this->_options;
   //}

   //public function jsonoptions()
   //{
   //   return json_encode($this->options());
   //}

   //public function loggedIn()
   //{
   //   return $this->uid === getValue($_SESSION, "sudokuLogin", "");
   //}

   //public function exists()
   //{
   //   return $this->uid > 0 && !empty($this->username);
   //}

   //public function initArray($array)
   //{
   //   foreach($array as $key => $value)
   //      if(property_exists($this, $key))
   //         $this->{$key} = $value;
   //}

//   //Init user from known uid
//   public function init($uid, $db = null)
//   {
//      $tempDB = empty($db);
//
//      if($tempDB)
//         $db = new MySudokuDB();
//
//      //Get the dang data already
//      $query = <<<SQL
//      SELECT u.username, u.uid, u.admin FROM users u WHERE u.uid=?
//SQL;
//      $row = $db->queryRow($query, "i", $uid);
//
//      //Database error (not a query error hopefully)
//      if($row === false)
//      {
//         $error = "Database failure: " . $db->getError();
//         return false;
//      }
//      else
//      {
//         $this->uid = getNumeric($row, "uid", -1);
//         $this->username = $row["username"];
//         $this->admin = $row["admin"];
//      }
//
//      if($tempDB)
//         $db->forceDisconnect();
//
//      return true;
//   }

   //Initialize from username
//   public function initFromUsername($username, $db = null)
//   {
//      if(($tempDB = empty($db)))
//         $db = new MySudokuDB();
//
//      //Get the dang data already
//      $row = $db->queryRow("SELECT uid FROM users WHERE username=?", "s", array($username));
//
//      //Database error (not a query error hopefully)
//      if($row === false)
//      {
//         $error = "Database failure: " . $db->getError();
//         return false;
//      }
//      else
//      {
//         $result = $this->init($row["uid"], $db);
//      }
//
//      if($tempDB)
//         $db->forceDisconnect();
//
//      return $result;
//   }

 //  public static function userExists($username)
 //  {
 //     $user = new SudokuUser();
 //     $user->initFromUsername($username);

 //     return $user->exists();
 //  }

   //Return true or false depending on whether the supplied info was correct
//   public static function loginCheck($username, $password, $db = null)
//   {
//      $tempDB = empty($db);
//
//      if($tempDB)
//         $db = new MySudokuDB();
//
//      $result = $db->queryrow("SELECT username,password FROM users WHERE username=?",
//         "s", array($username));
//
//      if($tempDB)
//         $db->forceDisconnect();
//
//      return ($result === false) ? false : password_verify($password, $result["password"]);
//   }

   //Pull user info from session variable (or return false if not set)
//   public static function getUserFromSession($default = false)
//   {
//      //Gen user info
//      $userinfo = false;
//      $uid = getValue($_SESSION, "sudokuLogin");
//
//      if(!empty($uid))
//      {
//         $userinfo = new SudokuUser();
//
//         //Oops, initialization failed
//         if($userinfo->init($uid) === false)
//            $userinfo = $default ? new SudokuUser() : false;
//      }
//
//      return $userinfo;
//   }

   //Update a user entry's given column
//   public static function userUpdate($username, $column, $newvalue, $type = "z")
//   {
//      $db = new MySudokuDB();
//      $realtype = "i";
//
//      if(!is_numeric($newvalue))
//         $realtype = "s";
//
//      //Override our type determining if the user provides one
//      if($type !== "z")
//         $realtype = $type;
//
//      $result = $db->query("UPDATE users SET " . $column . "=? WHERE username=?",
//         $realtype . "s", array($newvalue, $username));
//
//      $db->forceDisconnect();
//
//      return $result !== false;
//   }
//
//   public static function userLogout()
//   {
//      unset($_SESSION['sudokuLogin']);
//   }

//   public static function userLogin($uid, $extended = false)
//   {
//      $_SESSION["sudokuLogin"] = $uid;
//      $extended = true;
//
//      if($extended)
//         setcookie(session_name(),session_id(),time()+2629740,"/sudoku");
//      else
//         setcookie(session_name(),session_id(),0,"/sudoku");
//   }

//   public static function userRegister($username, $password, $db = null)
//   {
//      $tempDB = empty($db);
//
//      if($tempDB)
//         $db = new MySudokuDB();
//
//      $result = $db->query("INSERT INTO users(username,password) VALUES (?,?)",
//         "ss", array($username, password_hash($password, PASSWORD_DEFAULT)));
//
//      if($tempDB)
//         $db->forceDisconnect();
//
//      if($result !== false)
//      {
//         self::userLogin($result);
//         return true;
//      }
//
//      return false;
//   }
}