# cat .\example.py | python .\parse.py | node .\interp.js 
# works in powershell but not bash

def f(g):
  def plants(myArg):
    return myArg + 7

  def animals(arr):
    return arr - 16

  return animals(plants(g(42)))

f(lambda x: x + 1)

