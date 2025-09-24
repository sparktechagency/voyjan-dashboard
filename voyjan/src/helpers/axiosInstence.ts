import axios from "axios";
const token = localStorage.getItem('token');
export const axiosInstance = axios.create({
    baseURL: 'http://10.10.7.6:5008/api/v1',
    headers: {
        "Content-Type": "application/json",
        "Authorization":token?`Bearer ${token}`:"",
    },
});