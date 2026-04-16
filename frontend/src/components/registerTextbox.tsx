import { useState } from "react";

import LoginButton from "./loginButton";
import RegisterButton from "./registerButton";

export default function LoginForm(){

    const [email, setEmail] = useState<string>("");

    const [password, setPassword] = useState<string>("");

    return (
        <div>

        <input 
        type="text" 
        value = {email} 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
        placeholder="Enter First Name"/>

        <input 
        type="text" 
        value = {email} 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
        placeholder="Enter email"/>


        <input 
        type="text" 
        value = {email} 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
        placeholder="Enter email"/>


        <input 
        type="text" 
        value = {password} 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
        placeholder="Enter username"/>

        <RegisterButton/>

        </div>
    );
};