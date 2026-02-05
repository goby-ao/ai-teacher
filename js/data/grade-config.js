// 年级配置模块
// Grade Configuration Module

export const GRADE_CONFIG = {
    'grade2_2': {
        name: '二年级（下）',
        shortName: '2下',
        order: 1
    },
    'grade3_1': {
        name: '三年级（上）',
        shortName: '3上',
        order: 2
    }
};

export const DEFAULT_GRADE = 'grade2_2';

// 获取年级列表（按顺序排列）
export function getGradeList() {
    return Object.entries(GRADE_CONFIG)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([id, config]) => ({ id, ...config }));
}
