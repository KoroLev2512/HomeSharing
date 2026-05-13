"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/widgets/Input";
import Loader from "@/shared/ui/Loader/Loader";
import { MeService } from "@/shared/lib/meService";
import { BinIcon } from "@/shared/icons";
import styles from "./styles.module.scss";

type LegalMode = "ip" | "ooo";

export default function SettingsPage(): React.JSX.Element | null {
  const { data: session, status, update: updateSession } = useSession();

  const [isSaved, setIsSaved] = useState(false);
  const [legalMode, setLegalMode] = useState<LegalMode>("ip");

  const [isHost, setIsHost] = useState<boolean>(Boolean(session?.user?.isHost));
  const [hostUpdating, setHostUpdating] = useState<boolean>(false);
  const [hostError, setHostError] = useState<string | null>(null);
  const [hostMessage, setHostMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsHost(Boolean(session?.user?.isHost));
  }, [session?.user?.isHost]);

  useEffect(() => {
    if (!avatarModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAvatarModalOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [avatarModalOpen]);

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

  const onChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSaved(false);
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = () => {
    setIsSaved(true);
  };

  const hasCustomAvatar = Boolean(
    typeof session?.user?.image === "string" && session.user.image.trim().length > 0,
  );

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setAvatarError("Можно загружать только изображения");
      return;
    }
    setAvatarModalOpen(false);
    setAvatarUploading(true);
    setAvatarError(null);
    setIsSaved(false);
    try {
      const image = await MeService.uploadAvatar(file);
      setAvatarUrl(image || defaultAvatar);
      await updateSession?.({ user: { ...session?.user, image } });
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Не удалось загрузить фото");
    } finally {
      setAvatarUploading(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = "";
    }
  };

  const handleDeleteAvatar = () => {
    if (avatarUploading || !hasCustomAvatar) return;
    setAvatarModalOpen(false);
    setAvatarUploading(true);
    setAvatarError(null);
    setIsSaved(false);
    void MeService.resetAvatar()
      .then(async () => {
        setAvatarUrl(defaultAvatar);
        await updateSession?.({ user: { ...session?.user, image: null } });
      })
      .catch((err) => {
        setAvatarError(err instanceof Error ? err.message : "Не удалось удалить фото");
      })
      .finally(() => {
        setAvatarUploading(false);
      });
  };

  const handleAvatarFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    void uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    void uploadFile(file);
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
            <div
              className={styles.avatarEditor}
              data-modal-open={avatarModalOpen ? "" : undefined}
            >
              <div className={styles.avatarFrame}>
                {hasCustomAvatar && (
                  <button
                    type="button"
                    className={styles.avatarDeleteBtn}
                    onClick={handleDeleteAvatar}
                    aria-label="Удалить фото профиля"
                    disabled={avatarUploading}
                  >
                    <BinIcon />
                  </button>
                )}
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  onChange={handleAvatarFile}
                  className={styles.hiddenFileInput}
                  disabled={avatarUploading}
                  aria-hidden
                />
                <button
                  type="button"
                  className={styles.avatarTrigger}
                  aria-label="Фото профиля"
                  aria-haspopup="dialog"
                  disabled={avatarUploading}
                  onClick={() => {
                    if (avatarUploading) return;
                    setAvatarModalOpen(true);
                  }}
                >
                  <span className={styles.avatarRing}>
                    <Image src={avatarUrl} alt="" width={104} height={104} />
                    {avatarUploading && (
                      <span className={styles.avatarUploadOverlay} aria-live="polite">
                        <span className={styles.avatarUploadSpinner} />
                      </span>
                    )}
                    {!avatarUploading && (
                      <span className={styles.avatarHoverOverlay}>
                        <span className={styles.avatarHoverText}>Загрузить</span>
                      </span>
                    )}
                  </span>
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

      {avatarModalOpen && (
        <div
          className={styles.avatarModal}
          role="dialog"
          aria-modal="true"
          aria-label="Загрузка фото профиля"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setAvatarModalOpen(false);
          }}
        >
          <div className={styles.avatarModalCard}>
            <button
              type="button"
              className={styles.avatarModalClose}
              onClick={() => setAvatarModalOpen(false)}
              aria-label="Закрыть"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <h3 className={styles.avatarModalTitle}>Фото профиля</h3>

            <div
              className={`${styles.avatarDropzone} ${isDragging ? styles.avatarDropzoneDragging : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <svg className={styles.avatarDropzoneIcon} width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
                <path d="M24 8C16.268 8 10 14.268 10 22C10 22.353 10.015 22.703 10.044 23.049C7.147 24.283 5 27.163 5 30.5C5 35.194 8.806 39 13.5 39H34.5C39.194 39 43 35.194 43 30.5C43 27.163 40.853 24.283 37.956 23.049C37.985 22.703 38 22.353 38 22C38 14.268 31.732 8 24 8Z" fill="#F0F0F0" stroke="#D0D0D0" strokeWidth="1.5"/>
                <path d="M24 18V30M18 24L24 18L30 24" stroke="#8C8C8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className={styles.avatarDropzoneText}>Перетащите или загрузите фото</p>
              <p className={styles.avatarDropzoneHint}>PNG / JPEG / WEBP / AVIF. До 50 МБ.</p>
              <button
                type="button"
                className={styles.avatarDropzoneBtn}
                onClick={() => avatarFileInputRef.current?.click()}
              >
                Выбрать фото
              </button>
            </div>

            {hasCustomAvatar && (
              <button
                type="button"
                className={styles.avatarModalDelete}
                onClick={handleDeleteAvatar}
              >
                Удалить текущее фото
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
