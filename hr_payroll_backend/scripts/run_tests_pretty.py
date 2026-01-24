#!/usr/bin/env python3
"""
Run Django tests and print a compact, pretty summary similar to PHPUnit output.

Usage:
  python scripts/run_tests_pretty.py [dotted.test.path ...]

If no tests are provided, defaults to running all tests.
"""
import os
import sys
import time
import django
from django.test.runner import DiscoverRunner


def color(text, code):
    return f"\033[{code}m{text}\033[0m"


def green(text):
    return color(text, '32')


def red(text):
    return color(text, '31')


def yellow(text):
    return color(text, '33')


def main():
    # Ensure we run from project root where manage.py lives
    base = os.path.dirname(os.path.dirname(__file__))
    sys.path.insert(0, base)

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        django.setup()
    except Exception as e:
        print(red('Failed to setup Django:'), e)
        sys.exit(1)

    tests = sys.argv[1:] or None

    runner = DiscoverRunner(verbosity=1, interactive=False, failfast=False)

    start = time.time()

    if tests:
        print(f"Running {len(tests)} test target(s): {tests}")
    else:
        print("Running all tests")

    # If tests specified, run them individually to capture per-test status
    passed = []
    failed = []
    errored = []
    total = 0

    if tests:
        for target in tests:
            # Use build_suite to get a TestSuite and iterate tests
            suite = runner.build_suite([target])
            for t in suite:
                total += 1
                single_suite = type(suite)([t])
                result = runner.run_suite(single_suite)
                if result.failures:
                    failed.append((t.id(), result.failures[0][1]))
                    print(red(f"✖ {t.id()}"))
                elif result.errors:
                    errored.append((t.id(), result.errors[0][1]))
                    print(red(f"✖ {t.id()} (error)"))
                else:
                    passed.append(t.id())
                    print(green(f"✔ {t.id()}"))
    else:
        # Run full test suite
        total = None
        failures = runner.run_tests([])
        # runner.run_tests prints default output; we'll summarize below
        # If failures==0 then all passed
        duration = time.time() - start
        if failures == 0:
            print(green('\nPASS All tests'))
            print(green(f"Tests: all passed"))
        else:
            print(red(f"\nFailures: {failures}"))
        print(yellow(f"Duration: {duration:.2f}s"))
        return 0 if failures == 0 else 1

    duration = time.time() - start

    # Summary
    print('\n')
    if failed or errored:
        print(red('Tests Failed'))
        for tid, tb in failed + errored:
            print(red(f" - {tid}"))
        print()
    else:
        print(green('PASS Tests'))
    print(green(f"Passed: {len(passed)}"))
    print(red(f"Failed: {len(failed) + len(errored)}"))
    if total is not None:
        print(yellow(f"Total: {total}"))
    print(yellow(f"Duration: {duration:.2f}s"))

    return 0 if not (failed or errored) else 2


if __name__ == '__main__':
    sys.exit(main())
