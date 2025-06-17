import React from "react";
import {IFlatCard} from "@/lib/store/flats";
import {BinIcon} from "@/lib/icons/BinIcon";
import {CloseIcon} from "@/lib/icons/CloseIcon";
import {CopyIcon} from "@/lib/icons/CopyIcon";
import {EditIcon} from "@/lib/icons/EditIcon";
import {LockFlatIcon} from "@/lib/icons/LockFlatIcon";
import Image, { StaticImageData } from "next/image";
import styles from "./styles.module.scss";

interface IProps {
    flat: Omit<IFlatCard, 'img'> & { img: StaticImageData };
}

export const Flat = ({flat}: IProps) => {

    return (
        <div className={styles.flatWrapper}>
            <div
                className={styles.flat}
            >
                <div className={styles.titleWrapper}>
                    <p className={styles.title}>Информация о квартире</p>
                    <div className={styles.titleIcons}>
                        <button type="button" className={styles.iconButton}>
                            <EditIcon/>
                        </button>
                        <button type="button" className={styles.iconButton}>
                            <CloseIcon/>
                        </button>
                    </div>
                </div>

                <Image
                    src={flat.img}
                    alt="Изображение квартиры"
                    className={styles.image}
                    width={flat.img.width}
                    height={flat.img.height}
                />

                <div className={styles.buttons}>
                    <button type="button" className={`${styles.button} ${styles.openButton}`}>
                        <span className={styles.iconButton}><LockFlatIcon/></span>
                        Открыть
                    </button>
                    <button type="button" className={`${styles.button} ${styles.orderButton}`}>
                        Заказать уборку
                    </button>
                </div>
                <div className={styles.description}>
                    <p className={styles.descriptionTitle}>О квартире</p>
                    <div className={styles.descriptionBody}>
                        <div className={styles.location}>{flat.address}</div>
                        <div className={styles.dates}>
                            <div className={styles.descriptionPropertyName}>Дата заезда:</div>
                            <div className={styles.dateText}>{flat.dateStart}</div>
                        </div>
                        <div className={styles.dates}>
                            <div className={styles.descriptionPropertyName}>Дата выезда:</div>
                            <div className={styles.dateText}>{flat.dateEnd}</div>
                        </div>
                        <div className={styles.statuses}>
                            <div className={styles.descriptionPropertyName}>Статус замка</div>
                            {flat.tagLock &&
                                <div className={`${styles.tag} ${flat.tagLock.name}`}>{flat.tagLock.text}</div>}
                        </div>
                        <div className={styles.statuses}>
                            <div className={styles.descriptionPropertyName}>Статус квартиры</div>
                            {flat.tagFlat &&
                                <div className={`${styles.tag} ${flat.tagFlat.name}`}>{flat.tagFlat.text}</div>}
                        </div>
                    </div>

                    <p className={styles.descriptionTitle}>WI-FI</p>
                    <div className={styles.descriptionBody}>
                        <div className={styles.wifi}>
                            <div className={styles.wifiText}>
                                <div className={styles.descriptionPropertyName}>Имя сети:</div>
                                <div className={styles.dateText}>WI-FI_CHAIKOVSKOGO</div>
                            </div>
                            <button className={`${styles.wifiIcon} ${styles.iconButton}`}><CopyIcon/></button>
                        </div>
                        <div className={styles.wifi}>
                            <div className={styles.wifiText}>
                                <div className={styles.descriptionPropertyName}>Пароль:</div>
                                <div className={styles.dateText}>12345678</div>
                            </div>
                            <div className={`${styles.wifiIcon} ${styles.iconButton}`}><CopyIcon/></div>
                        </div>
                    </div>

                    <p className={styles.descriptionTitle}>Управление доступом</p>
                    <div className={styles.descriptionBody}>
                        {flat.persons.map((person) =>
                            <div className={styles.personCard} key={person.id}>
                                <div className={styles.personWrapper}>
                                    <img
                                        src={person.icon}
                                        alt="Аватарка пользователя"
                                        className={styles.avatar}
                                    />
                                    <div className={styles.person}>
                                        <div className={styles.personName}>{person.name}</div>
                                        <div className={styles.personRole}>{person.role}</div>
                                    </div>
                                </div>
                                <button className={styles.iconButton} type="button"><BinIcon/></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};