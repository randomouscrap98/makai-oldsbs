namespace makai.Sudoku;

public class QueryObject
{
    public bool queryok {get;set;}
    public object? result {get;set;}
    public bool resultislink {get;set;}
    public List<string> errors {get;set;} = new List<string>();
    public List<string> warnings {get;set;} = new List<string>();
    public object requester {get;set;} = false;
}