import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Scene',
        component: () => import('@/views/Scene.vue')
    },
    {
        path: '/:taskId',
        name: 'SceneDisplay',
        component: () => import('@/views/Scene.vue'),
        props: true,
    },
    {
        path: '/solve',
        name: 'Solve',
        component: () => import('@/views/Solve.vue')
    },
    {
        path: '/solve/:taskId',
        name: 'SolveTask',
        component: () => import('@/views/Solve.vue')
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

export default router