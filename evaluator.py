from typing import Any, List


def test_function(func_str: str, test_cases: List[Any]) -> str:
    print(func_str, test_cases)
    func_name = ""
    defined_function = None
    try:
        func_name = func_str.split("def")[1].split(" ")[1].split("(")[0]
    except Exception as e:
        return [
            'Could not find function definition! (Hint: define functions with "def f(a): ...")'
        ], False
    try:
        exec(func_str)
        defined_function = locals()[func_name]

    except Exception as e:
        return [str(e)], False

    results = []
    correct = True
    for t in test_cases:
        input, expected = t["input"], t["expected"]
        try:
            result = defined_function(*input)
            if result == expected:
                results.append(f"PASS: ({input}) => ({expected})")
            else:
                results.append(f"FAIL: ({input}) => ({expected}), received ({result})")
                correct = False
        except Exception as e:
            results.append(f"FAIL: ({input}) => ({expected}) with error: {str(e)}")
            correct = False

    return results, correct
