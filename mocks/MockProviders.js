import React from 'react';

export const MockPointsProvider = ({ children, points = 100, minusPoint = jest.fn() }) => {
    const PointsContext = React.createContext({ points, minusPoint });
    return <PointsContext.Provider value={{ points, minusPoint }}>{children}</PointsContext.Provider>;
};

export const MockTokensProvider = ({ children, points = 50 }) => {
    const TokensContext = React.createContext({ points });
    return <TokensContext.Provider value={{ points }}>{children}</TokensContext.Provider>;
};

export const MockPetProvider = ({
                                    children,
                                    petData = { selectedPet: 0, petName: 'TestPet', hasPet: true },
                                    isLoading = false,
                                    setPetData = jest.fn()
                                }) => {
    const PetContext = React.createContext({ petData, isLoading, setPetData });
    return <PetContext.Provider value={{ petData, isLoading, setPetData }}>{children}</PetContext.Provider>;
};
