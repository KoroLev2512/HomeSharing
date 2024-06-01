import Image from "next/image";
import React from "react";
import { Message, MessageProps } from "@/ui/Card/Message";
import { Section } from "@/ui/Section";
import ErrorIcon from "../../public/icons/non_objects.svg";

const notFoundMessage: MessageProps = {
	description: "Кажется, эта страничка отправилась на мероприятие и не вернулась",
	title: "Упс! Что-то пошло не так...",
	image: (
		<Image
			src={ErrorIcon}
			height="100"
			width="100"
			alt="work in progress"
			style={{marginBottom:10}}
		/>
	),
};

const NotFoundPage = () => {
	return (
		<div>
			хуйня
		</div>
	);
};

export default NotFoundPage;
