import axiosInstance,{setTokens,clearTokens} from "../utils/axiosInstance";




export interface SetPasswordWithInvitationInput {
     invitation_token: string;
     password:string;
}

export interface Auth{
    access_token:string;
    refresh_token?:string;
}



class AuthService{
  async login(email:string,password:string){
      const response = await axiosInstance.post("/auth/login",{
        body:{
          email,password
        }
      } )
      const {access_token,refreshToken} = response.data
      setTokens(access_token,refreshToken)
    return response.data
  }

  async setPassword(info:SetPasswordWithInvitationInput){
    try{
      const response = await axiosInstance.post("/auth/set-password",{
      body:info
    } )

      const {access_token,refreshToken} = response.data
      setTokens(access_token,refreshToken)

    }catch(_error){
    }
  }
  async forgotPassword(){
      await axiosInstance.post("/auth/forgot-password" )
  }

  async logout(){
    try{
      await axiosInstance.post("/auth/logout" )
      clearTokens()
    }catch(_error){}
  }

}


const singleInstance = new AuthService()

export default singleInstance
