import requests


def measure_response_time():

    response = requests.get("http://localhost:8002/messages/count")

    print(f"Time: {response.elapsed.total_seconds()}")

    print(response.json())


measure_response_time()
