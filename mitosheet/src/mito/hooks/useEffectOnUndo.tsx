import { useEffect, useState } from "react";
import { AnalysisData } from "../types";

/* 
    This schedules an effect to run whenever there is a 
    successful undo.
*/
export const useEffectOnUndo = (effect: () => void, analysisData: AnalysisData): void => {
    
    const [startingUndoCount] = useState(analysisData.undoCount);
    useEffect(() => {
        
        if (analysisData.undoCount > startingUndoCount) {
            effect();
        }

    }, [analysisData.undoCount])
}