//Carlos Sanchez - 2015
//randomouscrap98@aol.com

//Anonymous functions so we don't have collisions.
(function() {

   //Functions to retrieve various important elements
   function loginButton()
   {
      return document.getElementById("loginButton");
   }
   function logoutButton()
   {
      return document.getElementById("logoutButton");
   }
   function switchCheckbox()
   {
      return document.getElementById("loginSwitch");
   }

   //This is performed as soon as the user submits their information
   function tryLogin(e)
   {
      e.preventDefault();
      var data = new window.FormData();
      var form = e.target;

		data.append("username", form.username.value);
		data.append("password", form.password.value);
		//data.append("password", MD5Library.Hash(form.password.value));

      if(switchCheckbox().checked)
         data.append("password2", form.password2.value);
         //data.append("password2", MD5Library.Hash(form.password2.value));

      fullGenericXHR(rootURL + "login", data, loginButton(), reloadSuccess);
   }

   function tryLogout(e)
   {
      e.preventDefault();
      var data = new window.FormData(e.target);
      fullGenericXHR(rootURL + "login", data, logoutButton(), reloadSuccess);
   }

   function switchLogin(e)
   {
      var button = loginButton();
      button.setAttribute("data-status", "");

      if(e.target.checked)
         button.innerHTML = "Create";
      else
         button.innerHTML = "Login";
   }

   function onLoad(e)
   {
      var loginForm = document.getElementById("loginForm");
      var logoutForm = document.getElementById("logoutForm");

      if(loginForm)
         loginForm.addEventListener("submit", tryLogin);
      if(logoutForm)
         logoutForm.addEventListener("submit", tryLogout);

      if(switchCheckbox())
         switchCheckbox().addEventListener("click", switchLogin);
   }

   window.addEventListener("load", onLoad);
})();
