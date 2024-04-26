import { getSession, useSession } from "next-auth/react";

export default function ProtectedPage() {
    const { data: session } = useSession({ required: true });

    if (session) {
        return (
            <div>
                <h1>Защищённая страница</h1>
                {session.user.role === 'admin' ? (
                    <p>Доступ к секретным данным администратора</p>
                ) : (
                    <p>Доступ ограничен</p>
                )}
            </div>
        );
    }
    return <p>Загрузка...</p>;
}

export async function getServerSideProps(context) {
    const session = await getSession(context);

    if (!session || session.user.role !== 'admin') {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        };
    }

    return {
        props: { session },
    };
}
