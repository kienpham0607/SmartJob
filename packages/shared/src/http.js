import axios from 'axios';
import { config } from './config.js';
import { ApiError } from './errors.js';

// A genuine HTTP boundary: never import another service's model.
export async function internalGet(service, path, params) {
  const settings = config();
  try {
    const response = await axios.get(`${settings.urls[service]}${path}`, {
      params,
      timeout: settings.timeout,
      proxy: false,
      headers: { 'x-service-token': settings.internalToken },
    });
    return response.data.data;
  } catch (error) {
    const status = error.response?.status;
    if (status === 404)
      throw new ApiError(404, 'Tài nguyên liên quan không còn tồn tại.', 'RELATED_NOT_FOUND');
    throw new ApiError(
      503,
      `Dịch vụ ${service} hiện không khả dụng. Vui lòng thử lại sau.`,
      'DEPENDENCY_UNAVAILABLE',
    );
  }
}
