using Dapper.Contrib.Extensions;

namespace makai.Sudoku;

[Table("users")]
public class SDBUser
{
    [Key]
    public int uid {get;set;}
    public DateTime created {get;set;}
    public string username {get;set;} = "";
    public string password {get;set;} = "";
    public bool admin {get;set;}
}

[Table("settings")]
public class SDBSetting
{
    [Key]
    public int sid {get;set;}
    public int uid {get;set;}
    public string name {get;set;} = "";
    public string value {get;set;} = "";
}

[Table("puzzles")]
public class SDBPuzzle
{
    [Key]
    public int pid {get;set;}
    public int uid {get;set;}
    public string solution {get;set;} = "";
    public string puzzle {get;set;} ="";
    public string puzzleset {get;set;} ="";
    public bool @public {get;set;}
}

[Table("inprogress")]
public class SDBInProgress
{
    [Key]
    public int ipid {get;set;}
    public int uid {get;set;}
    public int pid {get;set;}
    public DateTime paused {get;set;}
    public int seconds {get;set;}
    public string puzzle {get;set;} = ""; //this is json
}

[Table("completions")]
public class SDBCompletions
{
    [Key]
    public int cid {get;set;}
    public int uid {get;set;}
    public int pid {get;set;}
    public DateTime completed {get;set;}
    public int seconds {get;set;}
}
