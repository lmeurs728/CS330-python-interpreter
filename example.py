# cat .\example.py | python .\parse.py | node .\interp.js 
# works in powershell but not bash

def f(g):
  def lance(myArg):
    return myArg + 7
  return lance(g(42))

f(lambda x: x)

