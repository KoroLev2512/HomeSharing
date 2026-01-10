"use client";

import React, {useState, useEffect} from 'react';
import {Section} from "../../shared/ui/Section"
import {FlatCardList} from "@/widgets/FlatCard/FlatCardList";
import {useSession} from "next-auth/react";

import styles from "./styles.module.scss";
import {PlugIcon, SearchIcon, AddIcon} from "@/shared/icons";
import {IFlatCard} from "@/shared/store/flats";
import {Flat} from "../../widgets/Flat";
import {PrimaryButton} from "@/widgets/Button";
import {FlatModal} from "@/shared/ui/FlatModal";
import FlatService from "@/shared/lib/flatService";

export const HomeLayout: React.FC = () => {
    const [selectedFlat, setSelectedFlat] = useState<IFlatCard | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [flats, setFlats] = useState<IFlatCard[]>([]);
    const [isLoadingFlats, setIsLoadingFlats] = useState(true);
    const { data: session, status } = useSession();
    
    const isAuthenticated = status === 'authenticated' && session?.user;
    const isLoading = status === 'loading';

    useEffect(() => {
        if (isAuthenticated) {
            loadFlats();
        }
    }, [isAuthenticated]);

    const loadFlats = async () => {
        setIsLoadingFlats(true);
        try {
            const fetchedFlats = await FlatService.getFlats();
            setFlats(fetchedFlats);
        } catch (error) {
            console.error('Failed to load flats:', error);
        } finally {
            setIsLoadingFlats(false);
        }
    };
    
    return (
        <>
            <Section margin={0}>
                <div className={styles.headingWrapper}>
                    <h1 className={styles.title}>Мои объекты</h1>
                    <div className={styles.searchContainer}>
                        <div className={styles.searchField}>
                            <SearchIcon/>
                            <input
                                type="text"
                                placeholder="Найти"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </div>
                </div>
            </Section>
            <Section margin={0}>
                <div className={styles.wrapper}>
                    <div className={styles.listContainer}>
                        <div className={styles.tabBar}>
                            <button
                                className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
                                onClick={() => {
                                    setActiveTab('active');
                                    setSelectedFlat(null);
                                }}
                            >
                                Активные
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'archive' ? styles.tabActive : ''}`}
                                onClick={() => {
                                    setActiveTab('archive');
                                    setSelectedFlat(null);
                                }}
                            >
                                Архив
                            </button>
                        </div>
                        {isLoadingFlats ? (
                            <div className={styles.loading}>Загрузка...</div>
                        ) : (
                            <FlatCardList 
                                flats={flats}
                                setSelectedFlat={setSelectedFlat} 
                                selectedFlat={selectedFlat}
                                activeTab={activeTab}
                            />
                        )}
                    </div>
                    {selectedFlat ? (
                        <>
                            {/* Десктопная версия - показывается на экранах >= 1065px */}
                            <Flat 
                                flat={selectedFlat}
                                onClose={() => setSelectedFlat(null)}
                            />
                            {/* Мобильная версия - показывается на экранах < 1065px */}
                            <FlatModal
                                isOpen={!!selectedFlat}
                                onClose={() => setSelectedFlat(null)}
                            >
                                <Flat 
                                    flat={selectedFlat}
                                    onClose={() => setSelectedFlat(null)}
                                    isModal={true}
                                />
                            </FlatModal>
                        </>
                    ) : (
                        <div className={styles.plug}>
                            <div className={styles.plugContent}>
                                <PlugIcon/>
                                <div className={styles.plugText}>
                                    Выберите объект из списка чтобы увидеть информацию о нем.
                                </div>
                                <PrimaryButton className={styles.addButton}>
                                    <span>Добавить новый объект</span>
                                    <AddIcon color="#FFFFFF" width={24} height={24} />
                                </PrimaryButton>
                            </div>
                        </div>
                    )}
                </div>
            </Section>
        </>
    );
}
