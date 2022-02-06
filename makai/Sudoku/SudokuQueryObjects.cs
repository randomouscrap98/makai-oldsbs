namespace makai.Sudoku;

public class QueryByPid : SDBPuzzle
{
    public string playersolution {get;set;} = "";
    public int seconds {get;set;}
}

public class QueryByPuzzleset
{
    public int number {get;set;}
    public int pid {get;set;}
    public bool completed {get;set;} //cid {get;set;}
    public bool paused {get;set;} //ipid {get;set;}
    public DateTime completedOn {get;set;}
    public DateTime pausedOn {get;set;}
}