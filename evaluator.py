
from typing import Any, List, Tuple
import sys

    

def test_function(func_str: str, test_cases: List[Any]) -> str:
    func_name = ''
    defined_function = None
    try:
        func_name = func_str.split('def')[1].split(' ')[1].split('(')[0]
    except Exception as e:
        return ['Could not find function definition! (Hint: define functions with "def f(a): ...")']
    try:
        exec(func_str)
        defined_function = locals()[func_name]

    except Exception as e:
        return [e]

    results = []
    for t in test_cases:
        input, expected = t['input'], t['expected']
        try:
            result = defined_function(*input)
            if result == expected:
                results.append(f'PASS: ({input}) => ({expected})')
            else:
                results.append(f'FAIL: ({input}) => ({expected}), received ({result})')
        except Exception as e:
            results.append(f'FAIL: ({input}) => ({expected}) with error: {e}')
    
    return results

