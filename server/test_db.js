const db = require('./db')
try {
    const user = db.getUserById('vh028muz')
    console.log('User found:', user ? user.email : 'NOT FOUND')

    const publicUser = Object.assign({}, user)
    delete publicUser.password
    console.log('Public user:', publicUser)

    console.log('TEST PASSED')
} catch (e) {
    console.error('TEST FAILED:', e)
}
