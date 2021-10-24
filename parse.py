import ast
import sys

def emit( x ):
    print( x, end = '' );

def emit_string(s):
    emit( '"' )
    emit( s )
    emit( '"' )
    
def s_expify_object(o):
    if o is None:
        emit( '#f' )
    elif isinstance(o,list):
        emit( '(' )

        first = True
        for p in o:
            if not first:
                emit( ' ' )
            first = False
            s_expify_object(p)
        
        emit( ')' )
    elif isinstance(o,str):
        emit_string( o )
    elif isinstance(o,bool):
        if o:
            emit( 'TRUE' )
        else:
            emit( 'FALSE' )
    elif isinstance(o,int):
        emit( o )
    else:
        emit( '(' )
        emit( o.__class__.__name__ )

        for (k,v) in ast.iter_fields(o):
            emit( ' ' )
            emit( '[' )
            emit( k )
            emit( ' ' )
            s_expify_object(v)
            emit( ']' )

        emit( ')' )
    
s_expify_object(ast.parse(sys.stdin.read()))
print( '' )