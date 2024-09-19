## Code structure
#### Client in `./frontend` directory
#### Server in `./backend` directory

## Before start, run redis container:
```
docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest
```

## Starting

Start FastApi backend server from `./backend` directory:
```commandline
uvicorn core.main:main_app --host 0.0.0.0 --port 8006 --reload
```


Install modules and start React frontend from `./frontend` directory:
```commandline
npm i
npm start
```


## Running tests
```commandline
cd backend
python -m pytest --cov=tests --cov-report=term
```
