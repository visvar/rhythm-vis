from flask_restful import Resource, Api
from flask_jsonpify import jsonify, jsonpify
from flask_cors import CORS
from flask import Flask, request
import json

########### CONFIG ###########
host = '127.0.0.1'
port = '12345'
debug = True
data_path = '../data/'
send_on_exception = True

# flask setup
app = Flask(__name__)
api = Api(app)
CORS(app)


@app.route('/', methods=('get', 'post'))
def rest():
    # parse JSON args
    try:
        args = json.loads(request.args['args'])
        if show_request_args:
            print('\nRequest arguments:')
            print(json.dumps(args, sort_keys=False, indent=4))

        action = args['action']

        return jsonify({
            'type': 'error',
            'msg': 'Missing arguments or invalid action!'
        })

    except Exception as e:
        print(e)
        if send_on_exception:
            return jsonify({
                'type': 'error',
                'msg': str(e.args[0])
            })
        else:
            raise


# start server when program starts
if __name__ == '__main__':
    print(f'Server is running at http://{host}:{port}/\n')
    if not debug:
        print(
            'Debug mode is disabled, server will not detect changes in code.')
    app.run(host=host, port=port, debug=debug)
