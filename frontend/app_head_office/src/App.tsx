import { headOfficeApi } from "./axios.config";
import { useIntl } from 'react-intl';


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

  const intl = useIntl();
  const date = new Date();

  return (
    <div>
      {intl.formatMessage({ id: "app_title" })}
      {intl.formatDate(date)}
      <p>Email de test: rico@bref.fr</p>
      <p>Mot de passe de test: P@ssword35</p>
    
      <button className="hover:cursor-pointer hover:bg-purple-700 font-bold bg-purple-500 rounded text-white p-1 mr-2" onClick={handleRegister}>
        register_button
      </button>

      <button className="hover:cursor-pointer hover:bg-purple-700 font-bold bg-purple-500 rounded text-white p-1 mr-2" onClick={handleLogin}>
        login_button
      </button>

      <button className="hover:cursor-pointer hover:bg-purple-700 font-bold bg-purple-500 rounded text-white p-1 mr-2" onClick={getUser}>
        getUser_button
      </button>

      <button className="hover:cursor-pointer hover:bg-purple-700 font-bold bg-purple-500 rounded text-white p-1 mr-2" onClick={handleLogout}>
        logout_button
      </button>
    </div>
  )
}

export default App;
