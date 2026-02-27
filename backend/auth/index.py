"""
Аутентификация: регистрация, вход и выход из аккаунта.
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p83164480_sparkle_launch')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    salt = 'sparkle_salt_2024'
    return hashlib.sha256((password + salt).encode()).hexdigest()


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    if not action:
        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'POST' and action == 'register':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')

            if not email or not password:
                return {'statusCode': 400, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Email и пароль обязательны'})}

            if len(password) < 6:
                return {'statusCode': 400, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Пароль должен быть не менее 6 символов'})}

            cur.execute(f'SELECT id FROM {SCHEMA}.users WHERE email = %s', (email,))
            if cur.fetchone():
                return {'statusCode': 400, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Пользователь с таким email уже существует'})}

            pw_hash = hash_password(password)
            cur.execute(
                f'INSERT INTO {SCHEMA}.users (email, password_hash) VALUES (%s, %s) RETURNING id, is_admin',
                (email, pw_hash)
            )
            user_id, is_admin = cur.fetchone()

            token = secrets.token_hex(32)
            cur.execute(
                f'INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)',
                (user_id, token)
            )
            conn.commit()

            return {'statusCode': 200, 'headers': CORS_HEADERS,
                    'body': json.dumps({'token': token, 'email': email, 'is_admin': is_admin})}

        elif method == 'POST' and action == 'login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')

            pw_hash = hash_password(password)
            cur.execute(
                f'SELECT id, is_admin FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s',
                (email, pw_hash)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Неверный email или пароль'})}

            user_id, is_admin = row
            token = secrets.token_hex(32)
            cur.execute(
                f'INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)',
                (user_id, token)
            )
            conn.commit()

            return {'statusCode': 200, 'headers': CORS_HEADERS,
                    'body': json.dumps({'token': token, 'email': email, 'is_admin': is_admin})}

        elif method == 'POST' and action == 'logout':
            token = event.get('headers', {}).get('X-Session-Token', '')
            if token:
                cur.execute(f'DELETE FROM {SCHEMA}.sessions WHERE token = %s', (token,))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS,
                    'body': json.dumps({'ok': True})}

        elif method == 'GET' and action == 'me':
            token = event.get('headers', {}).get('X-Session-Token', '')
            if not token:
                return {'statusCode': 401, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Не авторизован'})}

            cur.execute(
                f'''SELECT u.id, u.email, u.is_admin FROM {SCHEMA}.sessions s
                    JOIN {SCHEMA}.users u ON u.id = s.user_id
                    WHERE s.token = %s AND s.expires_at > NOW()''',
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Сессия истекла'})}

            user_id, email, is_admin = row
            return {'statusCode': 200, 'headers': CORS_HEADERS,
                    'body': json.dumps({'id': user_id, 'email': email, 'is_admin': is_admin})}

        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()