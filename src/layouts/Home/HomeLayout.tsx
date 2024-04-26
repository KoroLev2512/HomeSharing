import React from 'react';

import styles from './styles.module.scss';

export const HomeLayout: React.FC = () => {

    return (
        <>
            <a>
                <h1 className={styles.title}>Добрый день, Юрий</h1>
            </a>
        </>
    );
}
