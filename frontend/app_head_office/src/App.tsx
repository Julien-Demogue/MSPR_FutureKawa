import { headOfficeApi } from "./axios.config";


function App() {

  async function handleRegister() {
    const response = await headOfficeApi.post("/auth/register", {
      email: "rico@bref.fr",
      password: "P@ssword35",
      first_name: "Rico",
      phone_number: "0601020304",
    })
    console.log('✅ Register response:', response.status);
  }

  async function handleLogin() {
    const response = await headOfficeApi.post("/auth/login", {
      email: "rico@bref.fr",
      password: "P@ssword35",
    })

    console.log('✅ Login response:', response.data);
  }

  async function handleLogout() {
    const response = await headOfficeApi.post("/auth/logout");
    console.log(response.status === 201 ? '✅ Logout successful' : '❌ Logout failed');
  }

  async function getUser() {
    try {
      const start = new Date().getTime();
      const response = await headOfficeApi.get("/users/me");
      console.log('✅ getUser response.data:', response.data);
      console.log(new Date().getTime() - start);
    } catch (error) {
      console.error('❌ getUser error:', error);
    }
  }

  return (
    <div className="flex">
      <p>Email : rico@bref.fr</p>
      <p>Mot de passe : P@ssword35</p>

      <button onClick={handleRegister}>
        register_button
      </button>

      <button onClick={handleLogin}>
        login_button
      </button>

      <button onClick={getUser}>
        getUser_button
      </button>

      <button onClick={handleLogout}>
        logout_button
      </button>
    </div>
  )
}

export default App;
