import * as SecureStore from 'expo-secure-store'

const BASE_URL = 'https://lyfe-production-c46b.up.railway.app/api'

async function request(path, options = {}) {
  const token = await SecureStore.getItemAsync('token')
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

export const api = {
  auth: {
    login:         (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    signup:        (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    me:            ()     => request('/auth/me'),
    forgotPassword:(email)=> request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  },
  posts: {
    feed:          ()         => request('/posts/feed'),
    explore:       ()         => request('/posts'),
    byUser:        (username) => request(`/posts/user/${username}`),
    like:          (id)       => request(`/posts/${id}/like`, { method: 'POST' }),
    liked:         (id)       => request(`/posts/${id}/liked`),
    comments:      (id)       => request(`/posts/${id}/comments`),
    addComment:    (id, body) => request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
    delete:        (id)       => request(`/posts/${id}`, { method: 'DELETE' }),
  },
  profile: {
    get:           (username) => request(`/profile/${username}`),
    update:        (body)     => request('/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  follow: {
    status:        (username) => request(`/follow/${username}/status`),
    follow:        (username) => request(`/follow/${username}`, { method: 'POST' }),
    unfollow:      (username) => request(`/follow/${username}`, { method: 'DELETE' }),
    followers:     (username) => request(`/follow/${username}/followers`),
    following:     (username) => request(`/follow/${username}/following`),
  },
  messages: {
    inbox:         ()         => request('/messages'),
    unread:        ()         => request('/messages/unread'),
    thread:        (username) => request(`/messages/${username}`),
    send:          (username, body) => request(`/messages/${username}`, { method: 'POST', body: JSON.stringify(body) }),
    react:         (messageId, reaction) => request(`/messages/react/${messageId}`, { method: 'POST', body: JSON.stringify({ reaction }) }),
  },
}
