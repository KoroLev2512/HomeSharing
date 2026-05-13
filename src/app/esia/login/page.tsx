"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { VisibilityIcon, VisibilityOffIcon } from "@/shared/icons";
import styles from "./styles.module.scss";

type MockUser = {
    sub: string;
    email: string;
    fullname: string;
};

const presetUsers: MockUser[] = [
    {
        sub: "1000000001",
        email: "ivanov.ivan@example.ru",
        fullname: "Иванов Иван Иванович",
    },
    {
        sub: "1000000002",
        email: "petrova.maria@example.ru",
        fullname: "Петрова Мария Сергеевна",
    },
    {
        sub: "1000000003",
        email: "smirnov.alex@example.ru",
        fullname: "Смирнов Александр Дмитриевич",
    },
];

const MockEsiaLoginScreen: React.FC = () => {
    const search = useSearchParams();

    const params = useMemo(() => {
        return {
            client_id: search?.get("client_id") ?? "",
            redirect_uri: search?.get("redirect_uri") ?? "",
            response_type: search?.get("response_type") ?? "code",
            scope: search?.get("scope") ?? "openid fullname email",
            state: search?.get("state") ?? "",
            code_challenge: search?.get("code_challenge") ?? "",
            code_challenge_method: search?.get("code_challenge_method") ?? "",
        };
    }, [search]);

    const [selectedSub, setSelectedSub] = useState<string>(presetUsers[0]!.sub);
    const [customName, setCustomName] = useState(presetUsers[0]!.fullname);
    const [customEmail, setCustomEmail] = useState(presetUsers[0]!.email);
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestedScopes = useMemo(
        () =>
            params.scope
                .split(" ")
                .map((s) => s.trim())
                .filter(Boolean),
        [params.scope],
    );

    useEffect(() => {
        if (!params.client_id || !params.redirect_uri) {
            setError("Некорректный запрос: отсутствуют параметры client_id или redirect_uri.");
        }
    }, [params.client_id, params.redirect_uri]);

    useEffect(() => {
        const selected = presetUsers.find((u) => u.sub === selectedSub);
        if (!selected) return;
        setCustomName(selected.fullname);
        setCustomEmail(selected.email);
    }, [selectedSub]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);
        const trimmedName = customName.trim();
        const trimmedEmail = customEmail.trim();
        if (!trimmedName || !trimmedEmail) {
            setError("Укажите ФИО и email для тестового аккаунта.");
            return;
        }
        const matchedPreset =
            presetUsers.find((u) => u.fullname === trimmedName && u.email === trimmedEmail) ??
            presetUsers.find((u) => u.sub === selectedSub);
        const user: MockUser = matchedPreset ?? {
            sub: `custom-${Date.now()}`,
            email: trimmedEmail,
            fullname: trimmedName,
        };

        setSubmitting(true);
        try {
            const res = await fetch("/api/mock-esia/grant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_id: params.client_id,
                    redirect_uri: params.redirect_uri,
                    state: params.state,
                    scope: params.scope,
                    code_challenge: params.code_challenge || undefined,
                    code_challenge_method: params.code_challenge_method || undefined,
                    user,
                }),
            });
            const data = (await res.json()) as { redirectTo?: string; error?: string };
            if (!res.ok || !data.redirectTo) {
                setError(data.error ? `Ошибка: ${data.error}` : "Не удалось завершить вход.");
                setSubmitting(false);
                return;
            }
            window.location.assign(data.redirectTo);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Сетевая ошибка");
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (!params.redirect_uri) {
            window.history.back();
            return;
        }
        try {
            const target = new URL(params.redirect_uri);
            target.searchParams.set("error", "access_denied");
            if (params.state) target.searchParams.set("state", params.state);
            window.location.assign(target.toString());
        } catch {
            window.history.back();
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.brand}>
                    <Image
                        src="/icons/esia.png"
                        alt="Госуслуги"
                        width={216}
                        height={42}
                        className={styles.wordmarkImage}
                        priority
                    />
                    <div className={styles.brandSubtitle}>Тестовая среда ЕСИА</div>
                </div>
            </div>

            <p className={styles.subtitle}>
                Приложение <b>HomeSharing</b> запрашивает доступ к данным профиля
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.customFields}>
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>Телефон / Эл. почта / СНИЛС</span>
                        <input
                            type="text"
                            className={styles.input}
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder=""
                            autoComplete="off"
                        />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>Пароль</span>
                        <div className={styles.passwordField}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className={styles.input}
                                value={customEmail}
                                onChange={(e) => setCustomEmail(e.target.value)}
                                placeholder=""
                                autoComplete="off"
                            />
                            {customEmail.length > 0 && (
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                                    onClick={() => setShowPassword((value) => !value)}
                                >
                                    {showPassword ? (
                                        <VisibilityOffIcon width={20} height={20} />
                                    ) : (
                                        <VisibilityIcon width={20} height={20} />
                                    )}
                                </button>
                            )}
                        </div>
                        <a
                            className={styles.recoverButton}
                            href="https://arc.net/l/quote/oruahaxt"
                        >
                            Восстановить
                        </a>
                    </label>
                </div>

                {/* <div className={styles.users}>
                    {presetUsers.map((user, index) => (
                        <button
                            key={user.sub}
                            type="button"
                            className={`${styles.userOption}${
                                selectedSub === user.sub ? ` ${styles.userOptionActive}` : ""
                            }`}
                            onClick={() => setSelectedSub(user.sub)}
                        >
                            Тестовый аккаунт {index + 1}
                        </button>
                    ))}
                </div> */}

                {/* <div className={styles.scopes}>
                    Разрешения: {requestedScopes.join(", ")}
                </div> */}

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={handleCancel}
                        disabled={submitting}
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={submitting || Boolean(error && !params.redirect_uri)}
                    >
                        {submitting ? "Вход..." : "Войти"}
                    </button>
                </div>
                <button type="button" className={styles.loginHelpButton}>
                    Не удаётся войти
                </button>
            </form>

            {/* <div className={styles.note}>
                Портал работает в учебном режиме. В продакшене используется реальный портал{" "}
                <code>esia.gosuslugi.ru</code>.
            </div> */}
        </div>
    );
};

export default function MockEsiaLoginPage(): React.JSX.Element {
    return (
        <div className={styles.wrapper}>
            <Suspense fallback={<div className={styles.card}>Загрузка...</div>}>
                <MockEsiaLoginScreen />
            </Suspense>
        </div>
    );
}
