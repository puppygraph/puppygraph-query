import contextlib
from gremlin_python.driver import client
from gremlin_python.driver.resultset import ResultSet
from gremlin_python.driver.serializer import GraphSONSerializersV3d0
from gremlin_python.statics import load_statics

import argparse
import time
from datetime import timedelta
from itertools import chain, islice
from pathlib import Path

# Sample usage:
#     python3 gremlin_client.py -e=<host>:<port> -q="g.V().count()"


load_statics(globals())

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Script to call a remote Gremlin server",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )

    parser.add_argument(
        "-e",
        "--endpoint",
        default="localhost:8182",
        type=str,
        help="Gremlin server ip and port",
    )
    parser.add_argument(
        "-u",
        "--username",
        default="puppygraph",
        type=str,
        help="Username for Gremlin server authentication",
    )
    parser.add_argument(
        "-p",
        "--password",
        default="888888",
        type=str,
        help="password for Gremlin server authentication",
    )
    parser.add_argument(
        "-q",
        "--query",
        default="g.V()",
        type=str,
        help="Gremlin query to execute",
    )
    parser.add_argument(
        "-f",
        "--file",
        type=str,
        help="File with Gremlin query to execute",
    )
    parser.add_argument(
        "-t",
        "--timeout",
        type=int,
        default=30000,
        help="Gremlin server evaluation timeout in microseconds",
    )
    parser.add_argument(
        "-l",
        "--limit",
        type=int,
        default=10,
        help="Max number of results to return. Setting it to zero (0) to remove the limit",
    )

    args: argparse.Namespace = parser.parse_args()

    if args.file:
        with Path(args.file).expanduser().open("r") as fin:
            query = fin.read()
            print(f"Executing Gremlin query `{query}` from file `{args.file}`...")
    elif args.query:
        query = args.query
        print(f"Executing Gremlin query `{query}`...")
    else:
        raise ValueError("Couldn't find query to execute!")

    with contextlib.closing(
        client.Client(
            f"ws://{args.endpoint}/gremlin",
            traversal_source="g",
            username=args.username,
            password=args.password,
            message_serializer=GraphSONSerializersV3d0(),
        )
    ) as client:
        start_time = time.monotonic()
        result_set: ResultSet = client.submit(
            query, request_options={"evaluationTimeout": args.timeout}
        )
        if args.limit == 0:
            top_result_set = result_set.all().result()
        else:
            top_result_set = list(islice(chain.from_iterable(result_set), args.limit))
        end_time = time.monotonic()
        print(f"Query used: {timedelta(seconds=end_time - start_time)}")

        print(f"Retrieved {len(top_result_set)} results:")
        for idx, result in enumerate(top_result_set):
            print(f"{idx}:\t{result}")
