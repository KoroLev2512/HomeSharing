import React from 'react';
import {Text} from "@/ui/Text"
import {User} from "@/entities/User/types/userState";


export const Title = ({ children, user}: IProps) => {
    return (
        <div>
            <Text as="h1">Главная</Text>
            {/*<Text as="h1">Добрый день, {user?.given_name}!</Text>*/}
        </div>
    );
};
