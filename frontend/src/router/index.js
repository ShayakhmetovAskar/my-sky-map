import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

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
        component: () => import('@/views/Solve.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/solve/:taskId',
        name: 'SolveTask',
        component: () => import('@/views/Solve.vue'),
        meta: { requiresAuth: true },
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

router.beforeEach((to) => {
    if (to.meta.requiresAuth) {
        const { getToken, login } = useAuth()
        if (!getToken()) {
            login()
            return false
        }
    }
})

export default router
