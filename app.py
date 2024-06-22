from pymongo import MongoClient
import jwt
import datetime
import hashlib
from flask import (
    Flask,
    render_template,
    jsonify,
    redirect,
    request,
    url_for
)
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from os.path import join, dirname

dotenv = join(dirname(__file__), '.env')
load_dotenv(dotenv)

SECRET_KEY = os.environ.get('SECRET_KEY')
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['UPLOAD_FOLDER'] = './static/profile_pics'



@app.route('/')
def home():
    token = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_data = db.users.find_one({'username': payload['id']}, {'_id': False, 'pw': False})
        return render_template('index.html', user_data=user_data)
    except jwt.ExpiredSignatureError:
        return redirect(url_for('login', msg='Your login has expired. Please re-login'))
    except jwt.exceptions.DecodeError:
        return redirect(url_for('login', msg='There was a problem logging you in'))
    
    
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        pw_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
        
        isUser = db.users.find_one({
            'username': username,
            'pw': pw_hash
            })
        if isUser:
            payload = {
                'id': username,
                'exp': datetime.now() + timedelta(seconds=60 * 60 * 24)
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
            
            return jsonify({
                'result': 'success',
                'token': token
            })
        else:
            return jsonify({
                'result': 'failed',
                'msg': 'We could not find a user with that id/password combination😒'
            })
            
    return render_template('login.html', msg='have a sweet day! 🍫')

@app.route('/sign_up')
def signup():
    msg = request.args.get('msg')
    return render_template('register.html', msg=msg)

@app.route('/user/<username>')
def user(username):
    """an endpoint for retrieving a user's profile information
    """
    token = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        # if this is my own profile => true
        # if this is somebody else's profile => false
        status = username == payload['id']
        
        user_info = db.user.find_one(
            {'username': username},
            {'_id': False}
        )
        return render_template('user.html', user_info=user_info, status=status)
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for('home'))

@app.route('/sign_up/save', methods=['POST'])
def register():
    """an api endpoint for signing up
    """
    username = request.form['username']
    password = request.form['pw']
    hashed_pw = hashlib.sha256(password.encode('utf-8')).hexdigest()
    # enter the code for saving user data to database
    data = {
        'username': username,
        'pw': hashed_pw,
        'profile_name': username,
        'profile_pict': '',
        'default_profile_pict': 'profile_pics/profile_placeholder.png',
        'profile_desc': ''
    }
    db.users.insert_one(data)
    return jsonify({'result': 'success'})

@app.route('/sign_up/check_dup', methods=['POST'])
def check_dup():
    # ID we should check whether or not the id is already taken
    username = request.form['username']
    isExisted = bool(db.users.find_one({'username': username}))
    
    return jsonify({'result': 'success', 'isExisted': isExisted})

@app.route('/update_profile', methods=['POST'])
def update_profile():
    token = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        # Update our profile here
        username = request.form['username']
        bio = request.form['bio']
        profile_img = request.files['profile_img']
        curr_date = datetime.now().strftime('%d%m%Y-%H%M%S')
        
        if profile_img:
            img_name = profile_img.filename
            img_path = os.path.join('profile_pics', f'{curr_date}_{img_name}')
            profile_img.save(img_path)
        else:
            img_name = None
        data = {
                'username': username,
                'profile_name': username,
                'profile_desc': bio,
                'profile_pict': img_path
            }
        
        db.users.update_one({'username': payload['id']}, {'$set': data})
        return jsonify({'result': 'success', 'msg': 'Your profile has been updated!'})
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for('home'))
    

@app.route('/posting', methods=['POST'])
def posting():
    token = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        # create new post here
        username = db.users.find_one({'username': payload['id']}, {"_id": False, 'pw': False})
        print(username)
        sweets = request.form['sweets']
        date_post =  request.form['date_post']

        data = {
            'username': username,
            'sweets': sweets,
            'date_post': date_post,
        }
        
        db.posts.insert_one(data)
        return jsonify({'result': 'success', 'msg': 'Sweets uploaded🍫!'})
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for('home'))
    

@app.route('/get_posts', methods=['GET'])
def get_posts():
    token = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        posts = list(db.posts.find({}).sort("date", -1).limit(20))
        for post in posts:
            post['_id'] = str(post['_id'])
            post['likes'] = db.likes.count_documents({'post_id': post['_id'], 'reaction_type': 'heart'})
            post['stars'] = db.likes.count_documents({'post_id': post['_id'], 'reaction_type': 'star'})
            post['thumbs'] = db.likes.count_documents({'post_id': post['_id'], 'reaction_type': 'thumb'})
            post['liked_by_me'] = bool(db.likes.find_one({'username': payload['id'], 'post_id': post['_id'], 'reaction_type': 'heart'}))
            post['starred_by_me'] = bool(db.likes.find_one({'username': payload['id'], 'post_id': post['_id'], 'reaction_type': 'star'}))
            post['thumbed_by_me'] = bool(db.likes.find_one({'username': payload['id'], 'post_id': post['_id'], 'reaction_type': 'thumb'}))
        return jsonify({'result': 'success', 'posts': posts})
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for('login'))


@app.route('/update_posts', methods=['GET'])
def update_posts():
    token = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        # update post here
        return jsonify({'result': 'success', 'msg': 'Your profile has been updated!'})
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for('home'))

@app.route('/update_likes', methods=['POST'])
def update_likes():
    token = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_info = db.users.find_one({'username': payload['id']})
        
        data = request.get_json()
        post_id = data.get('postId')
        reaction_type = data.get('reactionType')
        is_like = data.get('isLike')
        
        if isinstance(is_like, bool):    
            like_data = {
                'post_id': post_id,
                'username': user_info['username'],
                'reaction_type': reaction_type,
            }    
            if is_like:
                db.likes.insert_one(like_data)
            else:
                db.likes.delete_one(like_data)
            likes_count = db.likes.count_documents({'post_id': post_id, 'reaction_type': reaction_type})
            return jsonify({'result': 'success', 'likes_count': likes_count})
        else:
            return jsonify({'result': 'failed', 'msg': 'it needs to be boolean'})
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return redirect(url_for('home'))

    

@app.route('/profile')
def profile():
    user = {
        'username': 'testing123'
    }
    return render_template('profile.html', user=user)

@app.route('/settings')
def setting():
    return render_template('setting.html')

@app.route('/secret')
def secret():
    token = request.cookies.get('mytoken')
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=['HS256']
        )
        user = db.users.find_one({'username': payload['id']})
        return render_template('secret.html', user=user)
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError):
        return render_template('login.html', msg='You need to log in first to access the secret page')

if __name__ == '__main__':
    app.run('0.0.0.0', port=3000, debug=True)