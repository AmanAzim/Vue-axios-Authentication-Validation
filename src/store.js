import Vue from 'vue'
import Vuex from 'vuex'
import authAxios from './Custom-axion'; //the REST API of firebase for authentication
import globalAxios from 'axios'; // the URL in the main.js file
import router from './router'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    idToken:null,
    userId:null,
    user:null,
    email:null
  },
  mutations: {
    authUser(state, userData){
        state.idToken=userData.token;
        state.userId=userData.userId;
    },
    storeUser(state, user){
      state.user=user;
    },
    clearAuthData(state){
      state.idToken=null;
      state.userId=null;
      state.email=null;
    }
  },

  actions: {
    signup({commit, dispatch, state}, authData){
      authAxios.post('/signupNewUser?key=AIzaSyDgx-TqVIEcws5Yp3_R5sCH5V6j0HnZAEE', {email:authData.email, password:authData.password, returnSecureToken:true})
          .then(res=>{
            console.log(res);
            commit('authUser', {token:res.data.idToken, userId:res.data.localId}); //first saves authentication data

              const now=new Date();
              const expirationDate=new Date(now.getTime()+res.data.expiresIn*1000); //convert the expireId into miliseconds of date time. Means we will store the date in when we got he expirationId plus the expiration time by converting them into milliseconds

              localStorage.setItem('expireDate', expirationDate);
              localStorage.setItem('idToken', res.data.idToken); //storing the idToken in the browser's storage so it don't get lost in page reload
              localStorage.setItem('userId', res.data.localId);

            dispatch('storeUser', authData); //then save all the data in the normal database by sending it with saved authintication data

            dispatch('setLogoutTimer', res.data.expiresIn);  //for auto logout
          }).catch(err=>console.log(err));
      state.email=authData.email;
    },

    login({commit, dispatch, state}, authData){
      authAxios.post('/verifyPassword?key=AIzaSyDgx-TqVIEcws5Yp3_R5sCH5V6j0HnZAEE', {email:authData.email, password:authData.password, returnSecureToken:true})
          .then(res=>{
            console.log(res);
            commit('authUser', {token:res.data.idToken, userId:res.data.localId});

              const now=new Date();
              const expirationDate=new Date(now.getTime()+res.data.expiresIn*1000); //convert the expireId into miliseconds of date time. Means we will store the date in when we got he expirationId plus the expiration time by converting them into milliseconds

              localStorage.setItem('expireDate', expirationDate);
              localStorage.setItem('idToken', res.data.idToken); //storing the idToken in the browser's storage so it don't get lost in page reload
              localStorage.setItem('userId', res.data.localId);

            dispatch('setLogoutTimer', res.data.expiresIn);
          }).catch(err=>console.log(err));
        state.email=authData.email;
    },

    tryAutologIn({commit}){
        const token=localStorage.getItem('idToken');
        if(!token){
            return;
        }

        const expireDate=localStorage.getItem('expireDate');
        const now=new Date();
        if(now>=expireDate){
            return;
        }
        const userId=localStorage.getItem('userId');

        commit('authUser', {token:token, userId:userId});
    },

    storeUser({commit, state}, formData){
      if(!state.idToken)
      {
        return;
      }
      globalAxios.post('/userData.json'+'?auth='+state.idToken, formData).then(res=> console.log(res)).catch(err=>console.log(err));
    },
//////////////////////////////////////////////////////////////////////////////////////////////////////////
    deleteCurrentUserNormalData({commit, state}){
        const token=localStorage.getItem('idToken');
        var id='';
        globalAxios.get('/userData.json?orderBy="email"&equalTo="'+state.email+'"').then(res=>{
            console.log(res.data);
            id=Object.keys(res.data);
            console.log("id:"+id);
            globalAxios.delete('/userData/'+id+'.json'+'?auth='+ token).then(res=> console.log(res)).catch(err=>console.log(err));
        });
    },
    deleteCurrentUserAge(state){
        const token=localStorage.getItem('idToken');
        globalAxios.delete('/userData/'+"-LYiZH_93bGvA8gPJYRs"+"/age"+'.json'+'?auth='+token)
            .then(res=> console.log(res)).catch(err=>console.log(err));
    },
    deleteCurrentUserAuthData({dispatch, state}){
        const token=localStorage.getItem('idToken');
        authAxios.post('/deleteAccount?key=AIzaSyDgx-TqVIEcws5Yp3_R5sCH5V6j0HnZAEE', token)
            .then(res=> console.log(res)).catch(err=>console.log(err));
        dispatch('logout');
    },

    deleteAllUsersNormalData({commit, dispatch, state}){
        globalAxios.delete('/userData.json/userId'+'?auth='+state.idToken).
        then(res=> console.log(res)).catch(err=>console.log(err));

        dispatch('logout');
    },
//////////////////////////////////////////////////////////////////////////////////////////////////////
    fetchUser({commit, state}){
      if(!state.idToken)
      {
        return;
      }
      globalAxios.get('/userData.json'+'?auth='+state.idToken)
          .then(res=>{
            console.log(res);
            const data=res.data;
              console.log(res.data);
            const users=[];
            for(let key in data){
              const user=data[key];
              user.id=key;
              users.push(user);
            }
            //this.email=users[0].email;
            commit('storeUser', users[0]);

          }).catch(err=>console.log(err));
    },

    logout({commit}){
      commit('clearAuthData');
        localStorage.removeItem('expireDate');
        localStorage.removeItem('idToken');
        localStorage.removeItem('userId');
      router.replace('/signin');
    },

    setLogoutTimer({commit, dispatch}, expirationTime){
        setTimeout(()=>{dispatch('logout')}, expirationTime*1000);
    }
  },
  getters: {
    user(state){
      return state.user;
    },
    isAuthenticated(state){
      return state.idToken !== null;
    }
  }
})