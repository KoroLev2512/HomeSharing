/**
 * LEGACY UI
 *
 * Archived detail widget for the old `Flat` domain.
 * Retained only as a reference during the transition to the active `listings` / host flows.
 */
import React, { useState } from "react";
import {IFlatCard} from "@/shared/store/flats";
import {AttachFileIcon, BinIcon, CloseIcon, CopyIcon, EditIcon, LockFlatIcon, StarIcon, CalendarIcon, VisibilityIcon, VisibilityOffIcon} from "@/shared/icons";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import Image, { StaticImageData } from "next/image";
import styles from "./styles.module.scss";

interface IProps {
    flat: IFlatCard;
    onClose?: () => void;
    isModal?: boolean;
}

export const Flat = ({flat, onClose, isModal = false}: IProps) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    // Предполагаем, что у нас есть массив изображений для галереи
    const images = [flat.img]; // В реальности это должен быть массив изображений

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    const handleToggleVisibility = () => {
        if (isVisible) {
            // Если объект видимый, показываем попап подтверждения
            setShowConfirmDialog(true);
        } else {
            // Если объект скрытый, просто показываем его обратно
            setIsVisible(true);
        }
    };

    const handleConfirmHide = () => {
        setIsVisible(false);
        // Здесь можно добавить логику изменения статуса объекта на сервере
    };

    const confirmDialog = (
        <ConfirmDialog
            isOpen={showConfirmDialog}
            onClose={() => setShowConfirmDialog(false)}
            onConfirm={handleConfirmHide}
            title="Скрыть объект?"
            message="Вы уверены, что хотите скрыть объект из поиска?"
            confirmLabel="Да"
            cancelLabel="Нет"
        />
    );

    const renderFlatContent = () => (
        <div className={styles.flat}>
            {/* Заголовок с кнопками */}
            <div className={styles.titleWrapper}>
                <p className={styles.title}>Информация о квартире</p>
                    <div className={styles.titleIcons}>
                        <button type="button" className={styles.iconButton}>
                            <AttachFileIcon/>
                        </button>
                        <button 
                            type="button" 
                            className={styles.iconButton}
                            onClick={handleToggleVisibility}
                        >
                            {isVisible ? <VisibilityIcon/> : <VisibilityOffIcon/>}
                        </button>
                        <button type="button" className={styles.iconButton}>
                            <EditIcon/>
                        </button>
                        <button 
                            type="button" 
                            className={styles.iconButton}
                            onClick={onClose}
                        >
                            <CloseIcon/>
                        </button>
                    </div>
                </div>

                {/* Изображение с навигацией */}
                <div className={styles.imageContainer}>
                    {typeof images[currentImageIndex] === 'string' ? (
                        <img
                            src={images[currentImageIndex] as string}
                            alt="Изображение квартиры"
                            className={styles.image}
                            style={{ objectFit: 'cover', width: '100%', height: '340px' }}
                        />
                    ) : (
                        <Image
                            src={images[currentImageIndex] as StaticImageData}
                            alt="Изображение квартиры"
                            className={styles.image}
                            width={700}
                            height={340}
                            style={{ objectFit: 'cover' }}
                        />
                    )}
                    <button 
                        className={styles.imageNavButton} 
                        onClick={handlePrevImage}
                        aria-label="Предыдущее изображение"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                    <button 
                        className={`${styles.imageNavButton} ${styles.imageNavButtonRight}`} 
                        onClick={handleNextImage}
                        aria-label="Следующее изображение"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>

                {/* Цена и рейтинг */}
                <div className={styles.priceRatingRow}>
                    <p className={styles.price}>{flat.price || '30 000 ₽'}</p>
                    <div className={styles.rating}>
                        <StarIcon color="#FFC043" width={24} height={24} />
                        <span className={styles.ratingText}>{flat.rating || '5.0'}</span>
                    </div>
                </div>

                {/* Разделитель */}
                <div className={styles.separator}></div>

                {/* О квартире */}
                <div className={styles.description}>
                    <p className={styles.descriptionTitle}>О квартире</p>
                    <div className={styles.descriptionBody}>
                        {/* Адрес */}
                        <div className={styles.listItem}>
                            <span className={styles.propertyName}>Адрес:</span>
                            <span className={styles.propertyValue}>{flat.address}</span>
                        </div>

                        {/* Удобства */}
                        <div className={styles.listItem}>
                            <span className={styles.propertyName}>Удобства:</span>
                            <div className={styles.amenities}>
                                <div className={`${styles.tag} ${styles.tagYellow}`}>Wifi</div>
                                <div className={`${styles.tag} ${styles.tagGreen}`}>Кухня</div>
                                <div className={`${styles.tag} ${styles.tagPurple}`}>Джакузи</div>
                            </div>
                        </div>

                        {/* Ближайшая аренда */}
                        <div className={styles.listItem}>
                            <span className={styles.propertyName}>Ближайшая аренда:</span>
                            <span className={styles.propertyValue}>{flat.dateRange}</span>
                            <CalendarIcon width={24} height={24} color="#757575" />
                        </div>

                        {/* Количество комнат и человек */}
                        <div className={styles.listItem}>
                            <span className={styles.propertyName}>Количество комнат:</span>
                            <span className={styles.propertyValue}>2</span>
                            <span className={styles.propertyName}>Количество человек:</span>
                            <span className={styles.propertyValue}>4</span>
                        </div>

                        {/* Статус замка */}
                        <div className={styles.listItem}>
                            <span className={styles.propertyName}>Статус замка</span>
                            {flat.tagLock && (
                                <div className={`${styles.tag} ${styles[flat.tagLock.name] || styles.tagYellow}`}>
                                    {flat.tagLock.text}
                                </div>
                            )}
                        </div>

                        {/* Статус квартиры */}
                        <div className={styles.listItem}>
                            <span className={styles.propertyName}>Статус квартиры</span>
                            {flat.tagFlat && (
                                <div className={`${styles.tag} ${styles[flat.tagFlat.name] || ''}`}>
                                    {flat.tagFlat.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Разделитель */}
                <div className={styles.separator}></div>

                {/* Кнопки */}
                <div className={styles.buttons}>
                    <button type="button" className={`${styles.button} ${styles.openButton}`}>
                        <LockFlatIcon color="#FFFFFF" width={24} height={24} />
                        <span>Открыть</span>
                    </button>
                    <button type="button" className={`${styles.button} ${styles.orderButton}`}>
                        Заказать уборку
                    </button>
                </div>

                {/* Отзывы */}
                <div className={styles.reviews}>
                    <p className={styles.descriptionTitle}>Отзывы</p>
                    <div className={styles.reviewsList}>
                        {/* Пример отзыва */}
                        <div className={styles.reviewCard}>
                            <div className={styles.reviewAvatar}>
                                <Image src="/users/user_1.png" alt="Аватар" width={32} height={32} />
                            </div>
                            <div className={styles.reviewContent}>
                                <div className={styles.reviewHeader}>
                                    <span className={styles.reviewName}>Петров Петр</span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <p className={styles.reviewText}>
                                    Снимали квартиру на новый год. Были приятно удивлены новогоднему декору от хозяина и маленьким подарочкам.
                                </p>
                                <div className={styles.reviewRating}>
                                    <StarIcon color="#FFC043" width={24} height={24} />
                                    <span className={styles.ratingText}>5.0</span>
                                </div>
                                <div className={styles.reviewReply}>
                                    <span className={styles.replyText}>Ответить на комментарий</span>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="#545454"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className={styles.reviewCard}>
                            <div className={styles.reviewContent}>
                                <div className={styles.reviewHeaderWithAvatar}>
                                    <div className={styles.reviewAvatar}>
                                        <Image src="/users/user_2.png" alt="Аватар" width={32} height={32} />
                                    </div>
                                    <div className={styles.reviewContentInner}>
                                        <div className={styles.reviewHeader}>
                                            <span className={styles.reviewName}>Мария Петрова</span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <p className={styles.reviewText}>
                                            Снимали квартиру на новый год. Были приятно удивлены новогоднему декору от хозяина и маленьким подарочкам.
                                        </p>
                                        <div className={styles.reviewRating}>
                                            <StarIcon color="#FFC043" width={24} height={24} />
                                            <span className={styles.ratingText}>5.0</span>
                                        </div>
                                        {/* Ответ на комментарий */}
                                        <div className={styles.reviewReplyNested}>
                                            <div className={styles.reviewAvatar}>
                                                <Image src="/users/user_1.png" alt="Аватар" width={32} height={32} />
                                            </div>
                                            <div>
                                                <span className={styles.reviewName}>Юрий Королев</span>
                                                <p className={styles.reviewText}>Спасибо за отзыв! Приезжайте еще :)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );

    if (isModal) {
        return (
            <>
                {renderFlatContent()}
                {confirmDialog}
            </>
        );
    }

    return (
        <div className={styles.flatWrapper}>
            {renderFlatContent()}
            {confirmDialog}
        </div>
    );
};
