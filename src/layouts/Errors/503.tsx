import Image from "next/image";
import React from "react";
import {Message, MessageProps} from "@/widgets/Card/Message";
import styles from "./errors.styles.module.scss";

const WorkerMessage: MessageProps = {
    description: "Сейчас наш сервис не доступен. Не волнуйтесь, мы просто решили сделать этот сайт немного лучше. Скоро всё будет работать",
    title: "Внимание! Проводятся технические работы",
    image: (
        <Image
            src={"/public/icons/logo.svg"}
            height="100"
            width="100"
            alt="work in progress"
        />
    ),
};

const WorkerPage = () => {
    return (
        <div className={styles.wrapper}>
            <div>
                <Message {...WorkerMessage} />
            </div>
        </div>
    );
};

export default WorkerPage;