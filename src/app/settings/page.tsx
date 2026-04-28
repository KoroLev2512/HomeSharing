"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/widgets/Input";
import Loader from "@/shared/ui/Loader/Loader";
import { MeService } from "@/shared/lib/bookingsService";
import styles from "./styles.module.scss";
import { BinIcon } from "@/shared/icons";

type LegalMode = "ip" | "ooo";

export default function SettingsPage(): React.JSX.Element | null {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();

  const [isSaved, setIsSaved] = useState(false);
  const [legalMode, setLegalMode] = useState<LegalMode>("ip");

  const [isHost, setIsHost] = useState<boolean>(Boolean(session?.user?.isService));
  const [hostUpdating, setHostUpdating] = useState<boolean>(false);
  const [hostError, setHostError] = useState<string | null>(null);
  const [hostMessage, setHostMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);

  useEffect(() => {
    setIsHost(Boolean(session?.user?.isService));
  }, [session?.user?.isService]);

  const handleToggleHost = async () => {
    if (hostUpdating) return;
    const next = !isHost;
    setHostUpdating(true);
    setHostError(null);
    setHostMessage(null);
    try {
      await MeService.setHost(next);
      setIsHost(next);
      setHostMessage(
        next
          ? "Роль арендодателя активирована. Перейдите в кабинет, чтобы добавить первое объявление."
          : "Роль арендодателя отключена.",
      );
      await updateSession?.();
    } catch (err) {
      setHostError(err instanceof Error ? err.message : "Не удалось обновить роль");
    } finally {
      setHostUpdating(false);
    }
  };

  const defaultAvatar = "/users/user_1.webp";
  const initialEmail = session?.user?.email ?? "";
  const initialName = session?.user?.name ?? "";

  const [avatarUrl, setAvatarUrl] = useState<string>(
    (typeof session?.user?.image === "string" && session.user.image) ? session.user.image : defaultAvatar,
  );

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    passport: "",
    phone: "",
    email: initialEmail,
    innIp: "",
    kppOoo: "",
    innOoo: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      email: session?.user?.email ?? prev.email,
      firstName: prev.firstName || initialName,
    }));

    setAvatarUrl(
      (typeof session?.user?.image === "string" && session.user.image) ? session.user.image : defaultAvatar,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email, session?.user?.image, initialName]);

  const fullNamePreview = useMemo(() => {
    const parts = [form.firstName, form.lastName].filter(Boolean);
    return parts.length ? parts.join(" ") : (session?.user?.email ?? "");
  }, [form.firstName, form.lastName, session?.user?.email]);

  const onChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSaved(false);
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = () => {
    // UI-only реализация (без запроса). Если нужно — подключим сохранение в Supabase.
    setIsSaved(true);
  };

  const handleDeleteAvatar = () => {
    if (avatarUploading) return;
    setAvatarUploading(true);
    setAvatarError(null);
    setIsSaved(false);
    void MeService.resetAvatar()
      .then(async () => {
        setAvatarUrl(defaultAvatar);
        await updateSession?.({
          user: {
            ...session?.user,
            image: null,
          },
        });
      })
      .catch((err) => {
        setAvatarError(err instanceof Error ? err.message : "Не удалось удалить фото");
      })
      .finally(() => {
        setAvatarUploading(false);
      });
  };

  const handleAvatarFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const input = e.currentTarget;
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Можно загружать только изображения");
      input.value = "";
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);
    setIsSaved(false);
    void MeService.uploadAvatar(file)
      .then(async (image) => {
        setAvatarUrl(image || defaultAvatar);
        await updateSession?.({
          user: {
            ...session?.user,
            image,
          },
        });
      })
      .catch((err) => {
        setAvatarError(err instanceof Error ? err.message : "Не удалось загрузить фото");
      })
      .finally(() => {
        setAvatarUploading(false);
        input.value = "";
      });
  };

  if (status === "loading") {
    return <Loader />;
  }

  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Параметры</h1>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Данные профиля</h2>

          <div className={styles.profilePhotoBlock}>
            <div className={styles.fieldLabel}>Фото профиля</div>
            <div className={styles.photoWrap}>
              <div className={styles.photo}>
                <img src={avatarUrl} alt="Фото профиля" />
              </div>
              <div className={styles.photoActions}>
                <label className={styles.uploadPhotoBtn}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className={styles.hiddenFileInput}
                    disabled={avatarUploading}
                  />
                  {avatarUploading ? "Загрузка..." : "Изменить"}
                </label>
                <button
                  type="button"
                  className={styles.deletePhotoBtn}
                  onClick={handleDeleteAvatar}
                  aria-label="Удалить фото профиля"
                  disabled={avatarUploading}
                >
                  <BinIcon />
                </button>
              </div>
            </div>
            {avatarError && <div className={styles.hostError}>{avatarError}</div>}
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <Input
                label="Имя"
                type="text"
                value={form.firstName}
                onChange={onChange("firstName")}
                placeholder="Иванов"
                size="medium"
                state="enabled"
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Фамилия"
                type="text"
                value={form.lastName}
                onChange={onChange("lastName")}
                placeholder="Иван"
                size="medium"
                state="enabled"
              />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <Input
                label="Отчество"
                type="text"
                value={form.middleName}
                onChange={onChange("middleName")}
                placeholder="Иванович"
                size="medium"
                state="enabled"
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Паспорт"
                type="text"
                value={form.passport}
                onChange={onChange("passport")}
                placeholder="3579 897605"
                size="medium"
                state="enabled"
              />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <Input
                label="Телефон"
                type="tel"
                value={form.phone}
                onChange={onChange("phone")}
                placeholder="+X (XXX) XXX-XX-XX"
                size="medium"
                state="enabled"
              />
            </div>
            <div className={styles.field}>
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={onChange("email")}
                placeholder="email@gmail.com"
                size="medium"
                state="enabled"
              />
            </div>
          </div>
        </section>

        {isHost && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Данные юридического лица</h2>
            <div className={styles.divider} />

            <div className={styles.legalTop}>
              <label className={styles.radioRow}>
                <input
                  type="radio"
                  name="legalMode"
                  checked={legalMode === "ip"}
                  onChange={() => {
                    setIsSaved(false);
                    setLegalMode("ip");
                  }}
                />
                <span>Работать как ИП</span>
              </label>

              <label className={styles.radioRow}>
                <input
                  type="radio"
                  name="legalMode"
                  checked={legalMode === "ooo"}
                  onChange={() => {
                    setIsSaved(false);
                    setLegalMode("ooo");
                  }}
                />
                <span>Работать как ООО</span>
              </label>
            </div>

            <div className={styles.legalGrid}>
              <div className={styles.legalCol}>
                <div className={styles.field}>
                  <Input
                    label="ИНН"
                    type="text"
                    value={form.innIp}
                    onChange={onChange("innIp")}
                    placeholder="10567557845"
                    size="medium"
                    state="enabled"
                  />
                </div>
              </div>

              <div className={styles.legalCol}>
                <div className={legalMode === "ip" ? styles.disabledGroup : undefined}>
                  <div className={styles.field}>
                    <Input
                      label="КПП"
                      type="text"
                      value={form.kppOoo}
                      onChange={onChange("kppOoo")}
                      placeholder="1056755784"
                      size="medium"
                      state={legalMode === "ip" ? "disabled" : "enabled"}
                      disabled={legalMode === "ip"}
                    />
                  </div>
                  <div className={styles.field}>
                    <Input
                      label="ИНН"
                      type="text"
                      value={form.innOoo}
                      onChange={onChange("innOoo")}
                      placeholder="10567557845"
                      size="medium"
                      state={legalMode === "ip" ? "disabled" : "enabled"}
                      disabled={legalMode === "ip"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Роль арендодателя</h2>
          <div className={styles.hostBlock}>
            <div className={styles.hostInfo}>
              <div className={styles.hostTitle}>
                {isHost ? "Вы — арендодатель" : "Стать арендодателем"}
              </div>
              <p className={styles.hostText}>
                {isHost
                  ? "Вы можете публиковать собственные объявления и принимать заявки на бронирование."
                  : "Активируйте роль арендодателя, чтобы размещать свои квартиры и получать заявки от гостей."}
              </p>
              {hostError && <div className={styles.hostError}>{hostError}</div>}
              {hostMessage && <div className={styles.hostMessage}>{hostMessage}</div>}
            </div>
            <div className={styles.hostActions}>
              <button
                type="button"
                onClick={handleToggleHost}
                disabled={hostUpdating}
                className={isHost ? styles.hostBtnSecondary : styles.hostBtnPrimary}
              >
                {hostUpdating
                  ? "Обновляем..."
                  : isHost
                  ? "Отключить роль"
                  : "Стать арендодателем"}
              </button>
              {isHost && (
                <Link href="/host/listings" className={styles.hostBtnLink}>
                  Перейти в кабинет →
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className={styles.footer}>
          <button type="button" className={styles.saveBtn} onClick={handleSave}>
            Сохранить данные профиля
          </button>
          {isSaved && <div className={styles.savedText}>Данные профиля успешно сохранены</div>}
          {!isSaved && <div className={styles.savedTextPlaceholder} aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}
