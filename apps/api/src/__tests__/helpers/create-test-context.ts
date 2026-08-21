
export function createTestContext(overrides? : {authToken?: string; cookies?: Record<string,string>}){
    const cookieJar: Record<string,string> = {...overrides?.cookies};

    const ctx = {
        createCookie: function(name: string, value:string, _options?: any){
            cookieJar[name] = value;
        },
        getCookie: function(name: string){
            return cookieJar[name];
        },
        clearCookie: function(name:string){
            delete cookieJar[name];
        },
        getAuthHeader: function(){
            return overrides?.authToken;
        },
        userId: null
    }

    return {ctx,  cookieJar};

}