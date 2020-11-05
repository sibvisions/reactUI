interface LoginRequest {
    clientId: string | undefined
    username: string | undefined
    password: string | undefined
    createAuthKey: boolean
}
export default LoginRequest;