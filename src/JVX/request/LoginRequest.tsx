interface LoginRequest {
    clientId: string | undefined;
    loginData : {
        userName: {
            componentId: string | undefined,
            text: string | undefined
        },
        password:{
            componentId: string | undefined,
            text: string | undefined
        },
        action: {
            componentId: string | undefined,
            label: string | undefined
        }
    },
    createAuthKey: boolean
}
export default LoginRequest;