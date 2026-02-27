"""
Обращения пользователей: отправка письма и получение списка для админа.
"""
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p83164480_sparkle_launch')
ADMIN_EMAIL = 'atamankinartjom@yandex.ru'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user_from_token(cur, token: str):
    cur.execute(
        f'''SELECT u.id, u.email, u.is_admin FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()''',
        (token,)
    )
    return cur.fetchone()


def send_email_notification(user_email: str, subject: str, body: str):
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    if not smtp_password:
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Новое обращение: {subject}'
    msg['From'] = ADMIN_EMAIL
    msg['To'] = ADMIN_EMAIL

    html = f"""
    <html><body>
    <h3>Новое обращение от пользователя</h3>
    <p><b>От:</b> {user_email}</p>
    <p><b>Тема:</b> {subject}</p>
    <p><b>Сообщение:</b></p>
    <p>{body.replace(chr(10), '<br>')}</p>
    </body></html>
    """
    msg.attach(MIMEText(html, 'html', 'utf-8'))

    with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
        server.login(ADMIN_EMAIL, smtp_password)
        server.send_message(msg)


def send_reply_email(user_email: str, subject: str, reply_text: str):
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    if not smtp_password:
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Ответ на ваше обращение: {subject}'
    msg['From'] = ADMIN_EMAIL
    msg['To'] = user_email

    html = f"""
    <html><body>
    <h3>Ответ на ваше обращение</h3>
    <p><b>Тема:</b> {subject}</p>
    <p><b>Ответ:</b></p>
    <p>{reply_text.replace(chr(10), '<br>')}</p>
    <hr>
    <p style="color:#888;font-size:12px">Это письмо отправлено автоматически в ответ на ваше обращение.</p>
    </body></html>
    """
    msg.attach(MIMEText(html, 'html', 'utf-8'))

    with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
        server.login(ADMIN_EMAIL, smtp_password)
        server.send_message(msg)


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    token = event.get('headers', {}).get('X-Session-Token', '')

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    if not action:
        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}

    conn = get_conn()
    cur = conn.cursor()

    try:
        user = get_user_from_token(cur, token) if token else None

        # POST action=send — отправить обращение
        if method == 'POST' and action == 'send':
            if not user:
                return {'statusCode': 401, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Необходимо войти в аккаунт'})}

            user_id, user_email, is_admin = user
            subject = body.get('subject', '').strip()
            msg_body = body.get('body', '').strip()

            if not subject or not msg_body:
                return {'statusCode': 400, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Тема и текст обращения обязательны'})}

            cur.execute(
                f'INSERT INTO {SCHEMA}.messages (user_id, user_email, subject, body) VALUES (%s, %s, %s, %s) RETURNING id',
                (user_id, user_email, subject, msg_body)
            )
            msg_id = cur.fetchone()[0]
            conn.commit()

            try:
                send_email_notification(user_email, subject, msg_body)
            except Exception:
                pass

            return {'statusCode': 200, 'headers': CORS_HEADERS,
                    'body': json.dumps({'ok': True, 'id': msg_id})}

        # GET action=my — мои обращения
        elif method == 'GET' and action == 'my':
            if not user:
                return {'statusCode': 401, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Необходимо войти в аккаунт'})}

            user_id, user_email, is_admin = user
            cur.execute(
                f'''SELECT id, subject, body, status, admin_reply, replied_at, created_at
                    FROM {SCHEMA}.messages WHERE user_id = %s ORDER BY created_at DESC''',
                (user_id,)
            )
            rows = cur.fetchall()
            msgs = [
                {
                    'id': r[0], 'subject': r[1], 'body': r[2],
                    'status': r[3], 'admin_reply': r[4],
                    'replied_at': r[5].isoformat() if r[5] else None,
                    'created_at': r[6].isoformat()
                }
                for r in rows
            ]
            return {'statusCode': 200, 'headers': CORS_HEADERS,
                    'body': json.dumps({'messages': msgs})}

        # GET action=admin_list — все обращения (только для админа)
        elif method == 'GET' and action == 'admin_list':
            if not user or not user[2]:
                return {'statusCode': 403, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Доступ запрещён'})}

            cur.execute(
                f'''SELECT id, user_email, subject, body, status, admin_reply, replied_at, created_at
                    FROM {SCHEMA}.messages ORDER BY created_at DESC'''
            )
            rows = cur.fetchall()
            msgs = [
                {
                    'id': r[0], 'user_email': r[1], 'subject': r[2], 'body': r[3],
                    'status': r[4], 'admin_reply': r[5],
                    'replied_at': r[6].isoformat() if r[6] else None,
                    'created_at': r[7].isoformat()
                }
                for r in rows
            ]
            return {'statusCode': 200, 'headers': CORS_HEADERS,
                    'body': json.dumps({'messages': msgs})}

        # POST action=admin_reply — ответить на обращение
        elif method == 'POST' and action == 'admin_reply':
            if not user or not user[2]:
                return {'statusCode': 403, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Доступ запрещён'})}

            msg_id = body.get('message_id')
            reply_text = body.get('reply', '').strip()

            if not msg_id or not reply_text:
                return {'statusCode': 400, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'ID сообщения и текст ответа обязательны'})}

            cur.execute(
                f'''UPDATE {SCHEMA}.messages SET admin_reply = %s, status = 'answered', replied_at = NOW()
                    WHERE id = %s RETURNING user_email, subject''',
                (reply_text, msg_id)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Сообщение не найдено'})}

            conn.commit()
            user_email, subject = row

            try:
                send_reply_email(user_email, subject, reply_text)
            except Exception:
                pass

            return {'statusCode': 200, 'headers': CORS_HEADERS,
                    'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()