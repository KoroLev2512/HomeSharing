"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/widgets/Input";
import styles from "./styles.module.scss";
import { BinIcon } from "@/shared/icons";

type LegalMode = "ip" | "ooo";

export default function SettingsPage(): React.JSX.Element {
  const { data: session } = useSession();

  const [isSaved, setIsSaved] = useState(false);
  const [legalMode, setLegalMode] = useState<LegalMode>("ip");

  const defaultAvatar = "/users/user_1.png";
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
    setIsSaved(false);
    setAvatarUrl(defaultAvatar);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Параметры</h1>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Данные профиля</h2>
          <div className={styles.divider} />

          <div className={styles.profilePhotoBlock}>
            <div className={styles.fieldLabel}>Фото профиля</div>
            <div className={styles.photoWrap}>
              <div className={styles.photo}>
                <img src={avatarUrl} alt="Фото профиля" />
              </div>
              <button
                type="button"
                className={styles.deletePhotoBtn}
                onClick={handleDeleteAvatar}
                aria-label="Удалить фото профиля"
              >
                <BinIcon />
              </button>
            </div>
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


