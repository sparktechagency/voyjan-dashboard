import axios from "axios";
const token = localStorage.getItem('token');
export const axiosInstance = axios.create({
    baseURL: 'https://api.voyagen.co.uk/api/v1',
    headers: {
        "Content-Type": "application/json",
        "Authorization":token?`Bearer ${token}`:"",
        "ngrok-skip-browser-warning":true
    },
});