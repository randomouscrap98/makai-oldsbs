namespace makai.Sudoku;

public class MySudokuOption
{
   //Don't show your privates
   public object? @default {get;set;}
   public object? @value {get;set;}
   public string title {get;set;} = "";
   public List<string>? possibles {get;set;} = null;

   public MySudokuOption() {}
   public MySudokuOption(object @default, string title, IEnumerable<string>? possibles = null)
   {
      this.@default = @default;
      this.title = title;
      this.possibles = possibles?.ToList();
   }
}